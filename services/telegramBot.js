const TelegramBot = require('node-telegram-bot-api');
const { getUserByTelegramId, updateUserSpreadsheet } = require('./database');
const { addExpenseToSheet } = require('./googleSheets');
const { generateAuthUrl } = require('./googleAuth');

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.token = process.env.TELEGRAM_BOT_TOKEN;
  }

  initialize() {
    if (!this.token) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      return;
    }

    this.bot = new TelegramBot(this.token, { polling: true });
    this.setupHandlers();
    console.log('Telegram bot initialized');
  }

  setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
Welcome to Expense Tracker Bot! 📊

To get started, you need to connect your Google account:
1. Click the link below to authenticate
2. Once authenticated, you can start tracking expenses

Send expenses in this format:
position / sum / date / source

Example: Coffee / 5.50 / 2024-01-15 / Starbucks

Commands:
/start - Show this message
/auth - Get authentication link
/help - Show help
      `;
      
      this.bot.sendMessage(chatId, welcomeMessage);
    });

    // Auth command
    this.bot.onText(/\/auth/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      try {
        const user = await getUserByTelegramId(userId);
        
        if (user && user.spreadsheetId) {
          this.bot.sendMessage(chatId, '✅ You are already authenticated and your spreadsheet is set up!');
          return;
        }

        const authUrl = generateAuthUrl(userId);
        const message = `🔐 Please click the link below to authenticate with Google:\n\n${authUrl}\n\nAfter authentication, I'll create a "Spending" spreadsheet for you.`;
        
        this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error('Auth command error:', error);
        this.bot.sendMessage(chatId, '❌ Error generating authentication link. Please try again.');
      }
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
📖 How to use Expense Tracker Bot:

1. First, authenticate with Google using /auth
2. Send expenses in this format:
   position / sum / date / source

Examples:
• Coffee / 5.50 / 2024-01-15 / Starbucks
• Lunch / 12.00 / today / McDonald's
• Gas / 45.00 / 2024-01-14 / Shell

Date formats supported:
• YYYY-MM-DD (2024-01-15)
• today
• yesterday

Your data will be automatically added to your Google Sheets with a pivot table for analysis!
      `;
      
      this.bot.sendMessage(chatId, helpMessage);
    });

    // Handle expense messages
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const text = msg.text;

      // Skip if it's a command
      if (text && text.startsWith('/')) {
        return;
      }

      // Parse expense format: position / sum / date / source
      if (text && text.includes('/')) {
        try {
          const parts = text.split('/').map(part => part.trim());
          
          if (parts.length !== 4) {
            this.bot.sendMessage(chatId, '❌ Invalid format. Please use: position / sum / date / source\n\nExample: Coffee / 5.50 / 2024-01-15 / Starbucks');
            return;
          }

          const [position, sum, date, source] = parts;

          // Validate sum is a number
          if (isNaN(parseFloat(sum))) {
            this.bot.sendMessage(chatId, '❌ Sum must be a valid number');
            return;
          }

          // Check if user is authenticated
          const user = await getUserByTelegramId(userId);
          if (!user || !user.spreadsheetId) {
            this.bot.sendMessage(chatId, '❌ Please authenticate first using /auth command');
            return;
          }

          // Process date
          const processedDate = this.processDate(date);

          // Add to spreadsheet
          await addExpenseToSheet(user.spreadsheetId, {
            position,
            sum: parseFloat(sum),
            date: processedDate,
            source
          });

          this.bot.sendMessage(chatId, `✅ Expense added successfully!\n\n📝 ${position}\n💰 $${sum}\n📅 ${processedDate}\n🏪 ${source}`);

        } catch (error) {
          console.error('Error processing expense:', error);
          this.bot.sendMessage(chatId, '❌ Error adding expense. Please try again or contact support.');
        }
      }
    });

    // Error handling
    this.bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });
  }

  processDate(dateStr) {
    const today = new Date();
    
    if (dateStr.toLowerCase() === 'today') {
      return today.toISOString().split('T')[0];
    }
    
    if (dateStr.toLowerCase() === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    
    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(dateStr)) {
      return dateStr;
    }
    
    // If invalid format, use today
    return today.toISOString().split('T')[0];
  }

  async sendMessage(chatId, message) {
    if (this.bot) {
      return this.bot.sendMessage(chatId, message);
    }
  }
}

module.exports = new TelegramBotService();