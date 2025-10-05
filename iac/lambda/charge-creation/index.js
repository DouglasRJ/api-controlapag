const fetch = require('node-fetch');
const AWS = require('aws-sdk');

const ssm = new AWS.SSM();

exports.handler = async event => {
  console.log('Starting daily charge creation process...');

  const apiToken = process.env.INTERNAL_API_TOKEN;
  const parameterName = process.env.API_IP_PARAMETER_NAME;

  if (!apiToken || !parameterName) {
    console.error('Environment variables are not set.');
    throw new Error('Missing environment variables.');
  }

  try {
    console.log(`Fetching API IP from parameter: ${parameterName}`);
    const parameter = await ssm.getParameter({ Name: parameterName }).promise();
    const apiUrl = `http://${parameter.Parameter.Value}:3000`;
    console.log(`API URL found: ${apiUrl}`);

    const response = await fetch(`${apiUrl}/cron/create-daily-charges`, {
      method: 'POST',
      headers: {
        'x-internal-api-token': apiToken,
      },
    });

    const responseBody = await response.json();

    if (!response.ok) {
      throw new Error(
        `API returned status ${response.status}: ${JSON.stringify(responseBody)}`,
      );
    }

    console.log('Successfully triggered daily charge creation:', responseBody);
    return responseBody;
  } catch (error) {
    console.error('Failed to trigger daily charge creation:', error);
    throw error;
  }
};
