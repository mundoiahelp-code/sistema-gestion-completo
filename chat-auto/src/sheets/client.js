import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { config } from '../config/config.js';

class SheetsClient {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = config.sheets.spreadsheetId;
  }

  async initialize() {
    try {
      const credentials = JSON.parse(readFileSync(config.sheets.credentialsPath, 'utf8'));
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const authClient = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      
      console.log('✅ Google Sheets conectado correctamente');
    } catch (error) {
      console.error('❌ Error al conectar con Google Sheets:', error.message);
      throw error;
    }
  }

  async readRange(range) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range
      });
      return response.data.values || [];
    } catch (error) {
      console.error(`Error al leer rango ${range}:`, error.message);
      return [];
    }
  }

  async appendRow(sheetName, values) {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [values]
        }
      });
      return true;
    } catch (error) {
      console.error(`Error al agregar fila en ${sheetName}:`, error.message);
      return false;
    }
  }

  async updateRow(range, values) {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [values]
        }
      });
      return true;
    } catch (error) {
      console.error(`Error al actualizar fila en ${range}:`, error.message);
      return false;
    }
  }

  async deleteRow(sheetName, rowIndex) {
    try {
      // Obtener el sheetId
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      
      const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
      if (!sheet) return false;

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }]
        }
      });
      return true;
    } catch (error) {
      console.error(`Error al eliminar fila en ${sheetName}:`, error.message);
      return false;
    }
  }

  async findRow(sheetName, columnIndex, searchValue) {
    try {
      const data = await this.readRange(`${sheetName}!A:Z`);
      const rowIndex = data.findIndex(row => row[columnIndex] === searchValue);
      return rowIndex >= 0 ? { index: rowIndex, data: data[rowIndex] } : null;
    } catch (error) {
      console.error(`Error al buscar fila en ${sheetName}:`, error.message);
      return null;
    }
  }
}

export default SheetsClient;
