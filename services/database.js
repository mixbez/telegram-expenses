const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'users.json');

async function initializeDatabase() {
  try {
    const dataDir = path.dirname(DB_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    
    try {
      await fs.access(DB_FILE);
    } catch {
      // File doesn't exist, create it
      await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
      console.log('Database initialized');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

async function readDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return [];
  }
}

async function writeDatabase(data) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
  }
}

async function getUserByTelegramId(telegramId) {
  const users = await readDatabase();
  return users.find(user => user.telegramId === telegramId);
}

async function getUserBySpreadsheetId(spreadsheetId) {
  const users = await readDatabase();
  return users.find(user => user.spreadsheetId === spreadsheetId);
}

async function saveUser(userData) {
  const users = await readDatabase();
  const existingIndex = users.findIndex(user => user.telegramId === userData.telegramId);
  
  if (existingIndex >= 0) {
    // Update existing user
    users[existingIndex] = { ...users[existingIndex], ...userData };
  } else {
    // Add new user
    users.push({
      telegramId: userData.telegramId,
      tokens: userData.tokens,
      authenticated: userData.authenticated,
      createdAt: new Date().toISOString()
    });
  }
  
  await writeDatabase(users);
  return users[existingIndex >= 0 ? existingIndex : users.length - 1];
}

async function updateUserSpreadsheet(telegramId, spreadsheetId) {
  const users = await readDatabase();
  const userIndex = users.findIndex(user => user.telegramId === telegramId);
  
  if (userIndex >= 0) {
    users[userIndex].spreadsheetId = spreadsheetId;
    users[userIndex].updatedAt = new Date().toISOString();
    await writeDatabase(users);
    return users[userIndex];
  }
  
  throw new Error('User not found');
}

module.exports = {
  initializeDatabase,
  getUserByTelegramId,
  getUserBySpreadsheetId,
  saveUser,
  updateUserSpreadsheet
};