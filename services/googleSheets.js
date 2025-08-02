const { google } = require('googleapis');
const { getAuthenticatedClient } = require('./googleAuth');
const { getUserByTelegramId, updateUserSpreadsheet } = require('./database');

async function createSpreadsheetForUser(telegramUserId) {
  try {
    const user = await getUserByTelegramId(telegramUserId);
    if (!user || !user.tokens) {
      throw new Error('User not authenticated');
    }

    const auth = getAuthenticatedClient(user.tokens);
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Create new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: 'Spending'
        },
        sheets: [
          {
            properties: {
              title: 'Expenses',
              gridProperties: {
                rowCount: 1000,
                columnCount: 4
              }
            }
          },
          {
            properties: {
              title: 'Pivot Analysis',
              gridProperties: {
                rowCount: 1000,
                columnCount: 10
              }
            }
          }
        ]
      }
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    // Add headers to the first sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Expenses!A1:D1',
      valueInputOption: 'RAW',
      resource: {
        values: [['Position', 'Sum', 'Date', 'Source']]
      }
    });

    // Format headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 4
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      }
    });

    // Create pivot table on second sheet
    await createPivotTable(spreadsheetId, auth);

    // Update user record with spreadsheet ID
    await updateUserSpreadsheet(telegramUserId, spreadsheetId);

    console.log(`Created spreadsheet for user ${telegramUserId}: ${spreadsheetId}`);
    return spreadsheetId;

  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

async function createPivotTable(spreadsheetId, auth) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            updateCells: {
              range: {
                sheetId: 1,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 3
              },
              rows: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Source' } },
                    { userEnteredValue: { stringValue: 'Total Amount' } },
                    { userEnteredValue: { stringValue: 'Count' } }
                  ]
                }
              ],
              fields: 'userEnteredValue'
            }
          },
          {
            repeatCell: {
              range: {
                sheetId: 1,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 3
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.9, green: 0.6, blue: 0.2 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      }
    });

    console.log('Pivot table headers created');
  } catch (error) {
    console.error('Error creating pivot table:', error);
  }
}

async function addExpenseToSheet(spreadsheetId, expense) {
  try {
    const user = await getUserByTelegramId(expense.telegramUserId);
    if (!user) {
      // Find user by spreadsheet ID
      const { getUserBySpreadsheetId } = require('./database');
      const userBySheet = await getUserBySpreadsheetId(spreadsheetId);
      if (!userBySheet) {
        throw new Error('User not found');
      }
      user = userBySheet;
    }

    const auth = getAuthenticatedClient(user.tokens);
    const sheets = google.sheets({ version: 'v4', auth });

    // Add the expense data
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Expenses!A:D',
      valueInputOption: 'RAW',
      resource: {
        values: [[
          expense.position,
          expense.sum,
          expense.date,
          expense.source
        ]]
      }
    });

    // Update pivot table data
    await updatePivotTable(spreadsheetId, auth);

    console.log('Expense added to spreadsheet:', expense);
  } catch (error) {
    console.error('Error adding expense to sheet:', error);
    throw error;
  }
}

async function updatePivotTable(spreadsheetId, auth) {
  try {
    const sheets = google.sheets({ version: 'v4', auth });

    // Get all expenses data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Expenses!A2:D'
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return;

    // Aggregate data by source
    const aggregated = {};
    rows.forEach(row => {
      const [position, sum, date, source] = row;
      if (!aggregated[source]) {
        aggregated[source] = { total: 0, count: 0 };
      }
      aggregated[source].total += parseFloat(sum) || 0;
      aggregated[source].count += 1;
    });

    // Prepare pivot table data
    const pivotData = Object.entries(aggregated).map(([source, data]) => [
      source,
      data.total.toFixed(2),
      data.count
    ]);

    // Clear existing pivot data (except headers)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Pivot Analysis!A2:C'
    });

    // Add new pivot data
    if (pivotData.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Pivot Analysis!A2',
        valueInputOption: 'RAW',
        resource: {
          values: pivotData
        }
      });
    }

  } catch (error) {
    console.error('Error updating pivot table:', error);
  }
}

module.exports = {
  createSpreadsheetForUser,
  addExpenseToSheet,
  updatePivotTable
};