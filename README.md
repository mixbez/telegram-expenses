# Telegram Bot + Google Sheets Integration

A Node.js application that connects a Telegram bot with Google Sheets for expense tracking.

## Features

- 🤖 Telegram bot that accepts expense data
- 📊 Automatic Google Sheets integration
- 🔐 Google OAuth authentication
- 📈 Pivot table creation for data analysis
- 🚀 Render-compatible deployment

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API and Google Drive API
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For local: `http://localhost:3000/auth/callback`
     - For production: `https://your-app-url.onrender.com/auth/callback`
5. Download the credentials and note the Client ID and Client Secret

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Update the following variables:
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
- `GOOGLE_REDIRECT_URI`: Your redirect URI
- `BASE_URL`: Your app's base URL

### 3. Local Development

```bash
npm install
npm run dev
```

### 4. Deployment to Render

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a Node.js service

## Usage

### Telegram Bot Commands

- `/start` - Welcome message and instructions
- `/auth` - Get Google authentication link
- `/help` - Show help information

### Adding Expenses

Send messages in the format:
```
position / sum / date / source
```

Examples:
- `Coffee / 5.50 / 2024-01-15 / Starbucks`
- `Lunch / 12.00 / today / McDonald's`
- `Gas / 45.00 / yesterday / Shell`

### Date Formats

- `YYYY-MM-DD` (e.g., 2024-01-15)
- `today`
- `yesterday`

## Google Sheets Structure

### Sheet 1: "Expenses"
- Column A: Position
- Column B: Sum
- Column C: Date
- Column D: Source

### Sheet 2: "Pivot Analysis"
- Automatically updated pivot table
- Groups expenses by source
- Shows totals and counts

## Project Structure

```
├── server.js              # Main server file
├── services/
│   ├── telegramBot.js     # Telegram bot logic
│   ├── googleAuth.js      # Google OAuth handling
│   ├── googleSheets.js    # Google Sheets operations
│   └── database.js        # Simple JSON database
├── routes/
│   └── auth.js           # Authentication routes
├── data/
│   └── users.json        # User data storage
└── package.json
```

## Security Notes

- User tokens are stored locally in JSON file
- For production, consider using a proper database
- Implement proper error handling and validation
- Consider rate limiting for API calls

## Troubleshooting

1. **Bot not responding**: Check if `TELEGRAM_BOT_TOKEN` is correct
2. **Authentication failing**: Verify Google OAuth credentials
3. **Spreadsheet not created**: Check Google API permissions
4. **Data not saving**: Verify file permissions for data directory

## License

MIT License