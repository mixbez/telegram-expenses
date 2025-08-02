const express = require('express');
const { handleAuthCallback } = require('../services/googleAuth');
const { createSpreadsheetForUser } = require('../services/googleSheets');
const telegramBot = require('../services/telegramBot');

const router = express.Router();

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code || !state) {
    return res.status(400).send('Missing authorization code or state');
  }

  try {
    const telegramUserId = parseInt(state);
    
    // Handle authentication
    await handleAuthCallback(code, telegramUserId);
    
    // Create spreadsheet for user
    const spreadsheetId = await createSpreadsheetForUser(telegramUserId);
    
    // Send success message to Telegram
    const message = `✅ Authentication successful!\n\n📊 Your "Spending" spreadsheet has been created.\n\nYou can now start sending expenses in this format:\nposition / sum / date / source\n\nExample: Coffee / 5.50 / today / Starbucks`;
    
    // Find user's chat ID (this is simplified - in production, you'd store chat IDs)
    // For now, we'll just show success page
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
          }
          .success-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #2d3748;
            margin-bottom: 20px;
          }
          p {
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 15px;
          }
          .example {
            background: #f7fafc;
            padding: 15px;
            border-radius: 10px;
            font-family: monospace;
            margin: 20px 0;
            border-left: 4px solid #4299e1;
          }
          .close-btn {
            background: #4299e1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Authentication Successful!</h1>
          <p>Your Google account has been connected successfully.</p>
          <p>📊 Your "Spending" spreadsheet has been created and is ready to use.</p>
          <p>Return to Telegram and start sending your expenses in this format:</p>
          <div class="example">
            position / sum / date / source<br><br>
            <strong>Example:</strong> Coffee / 5.50 / today / Starbucks
          </div>
          <p>Your data will be automatically organized with pivot tables for easy analysis!</p>
          <button class="close-btn" onclick="window.close()">Close Window</button>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #fed7d7;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Authentication Failed</h1>
          <p>There was an error during authentication. Please try again.</p>
          <p>Return to Telegram and use the /auth command to try again.</p>
        </div>
      </body>
      </html>
    `);
  }
});

module.exports = router;