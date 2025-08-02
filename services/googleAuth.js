const { google } = require('googleapis');
const { getUserByTelegramId, saveUser } = require('./database');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

function generateAuthUrl(telegramUserId) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: telegramUserId.toString(), // Pass telegram user ID in state
  });
  
  return authUrl;
}

async function handleAuthCallback(code, telegramUserId) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save user tokens
    await saveUser({
      telegramId: parseInt(telegramUserId),
      tokens: tokens,
      authenticated: true
    });

    return tokens;
  } catch (error) {
    console.error('Error during authentication:', error);
    throw error;
  }
}

function getAuthenticatedClient(tokens) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  client.setCredentials(tokens);
  return client;
}

module.exports = {
  generateAuthUrl,
  handleAuthCallback,
  getAuthenticatedClient,
  oauth2Client
};