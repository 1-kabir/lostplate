const axios = require('axios');

// Sends a push notification through Expo's push service. No Expo access
// token is required for moderate volume — good enough for a hackathon demo.
// Silently no-ops on a missing/invalid token so callers never need to guard
// every call site with an existence check.
async function sendExpoPush(pushToken, title, body, data = {}) {
  if (!pushToken || typeof pushToken !== 'string' || !pushToken.startsWith('ExponentPushToken')) {
    return { skipped: true, reason: 'No valid Expo push token on file' };
  }

  try {
    const response = await axios.post(
      'https://exp.host/--/api/v2/push/send',
      { to: pushToken, sound: 'default', title, body, data },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    );
    return { skipped: false, ticket: response.data };
  } catch (err) {
    console.error('Expo push send failure:', err.message);
    return { skipped: true, reason: err.message };
  }
}

module.exports = { sendExpoPush };
