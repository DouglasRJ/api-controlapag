const fetch = require('node-fetch');

exports.handler = async event => {
  console.log('Starting daily charge creation process...');

  const apiUrl = process.env.API_URL;
  const apiToken = process.env.INTERNAL_API_TOKEN;

  if (!apiUrl || !apiToken) {
    console.error(
      'API_URL or INTERNAL_API_TOKEN environment variable is not set.',
    );
    return;
  }

  try {
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
  } catch (error) {
    console.error('Failed to trigger daily charge creation:', error);
    throw error;
  }
};
