import { google } from 'googleapis';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function setupSheets() {
  try {
    console.log('🚀 Iniciando configuración de Google Sheets...\n');

    const credentials = JSON.parse(readFileSync('./google-credentials.json', 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // 1. Crear hoja de Stock
    console.log('📦 Creando hoja de Stock...');
    await createSheet(sheets, spreadsheetId, 'Stock');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Stock!A1:J1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          'Código',
          'Modelo',
          'GB',
          'Color',
          'Batería %',
          'Estado',
          'Precio',
          'Stock',
          'Sucursal',
          'Notas'
        ]]
      }
    });

    // 2. Crear hoja de Ventas
    console.log('💰 Creando hoja de Ventas...');
    await createSheet(sheets, spreadsheetId, 'Ventas');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Ventas!A1:J1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          'Fecha/Hora',
          'Cliente',
          'Teléfono',
          'Código Producto',
          'Producto',
          'Precio',
          'Método Pago',
          'Estado',
          'Fecha Turno',
          'Notas'
        ]]
      }
    });

    // 3. Crear hoja de Turnos
    console.log('📅 Creando hoja de Turnos...');
    await createSheet(sheets, spreadsheetId, 'Turnos');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Turnos!A1:G1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          'Fecha',
          'Hora',
          'Nombre',
          'Teléfono',
          'Producto',
          'Sucursal',
          'Estado'
        ]]
      }
    });

    // 4. Crear hoja de Clientes
    console.log('👥 Creando hoja de Clientes...');
    await createSheet(sheets, spreadsheetId, 'Clientes');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Clientes!A1:H1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          'Nombre',
          'Teléfono',
          'Email',
          'Primer Contacto',
          'Último Contacto',
          'Compras',
          'Último Producto',
          'Notas'
        ]]
      }
    });

    // 5. Crear hoja de Seguimientos
    console.log('🔄 Creando hoja de Seguimientos...');
    await createSheet(sheets, spreadsheetId, 'Seguimientos');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Seguimientos!A1:F1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          'Fecha Registro',
          'Teléfono',
          'Nombre',
          'Producto Interés',
          'Fecha Seguimiento',
          'Estado'
        ]]
      }
    });

    console.log('\n✅ Configuración completada exitosamente!');
    console.log('\n📋 Hojas creadas:');
    console.log('   - Stock');
    console.log('   - Ventas');
    console.log('   - Turnos');
    console.log('   - Clientes');
    console.log('   - Seguimientos');
    console.log('\n💡 Ahora puedes ejecutar: npm start');

  } catch (error) {
    console.error('❌ Error en la configuración:', error.message);
    process.exit(1);
  }
}

async function createSheet(sheets, spreadsheetId, title) {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: { title }
          }
        }]
      }
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`   ⚠️  La hoja "${title}" ya existe, saltando...`);
    } else {
      throw error;
    }
  }
}

setupSheets();
