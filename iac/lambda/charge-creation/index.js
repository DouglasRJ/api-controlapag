const fetch = require('node-fetch');

exports.handler = async event => {
  console.log('Starting daily charge creation process...');

  const apiToken = process.env.INTERNAL_API_TOKEN;
  const apiUrl = process.env.API_URL;

  if (!apiToken || !apiUrl) {
    console.error(
      'Environment variables INTERNAL_API_TOKEN or API_URL are not set.',
    );
    throw new Error('Missing environment variables.');
  }

  try {
    console.log(`Calling API URL: ${apiUrl}`);

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
