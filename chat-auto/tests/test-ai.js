import AnthropicClient from '../src/ai/anthropic.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAI() {
  console.log('🧪 Probando integración con Anthropic...\n');

  const ai = new AnthropicClient();

  // Test 1: Generar respuesta simple
  console.log('Test 1: Respuesta simple');
  console.log('Usuario: "Hola"');
  const response1 = await ai.generateResponse('Hola', {});
  console.log('Lumi:', response1);
  console.log('\n---\n');

  // Test 2: Consulta de stock
  console.log('Test 2: Consulta de stock');
  console.log('Usuario: "Que iPhones tenes?"');
  const stockData = [
    { modelo: 'iPhone 13 Pro', gb: '128', color: 'Plata', bateria: '95', estado: 'Impecable', precio: '85000' },
    { modelo: 'iPhone 14', gb: '256', color: 'Negro', bateria: '100', estado: 'Nuevo', precio: '120000' }
  ];
  const response2 = await ai.generateResponse('Que iPhones tenes?', { stockData });
  console.log('Lumi:', response2);
  console.log('\n---\n');

  // Test 3: Análisis de intención
  console.log('Test 3: Análisis de intención');
  const testMessages = [
    'Hola',
    'Que modelos tenes?',
    'Cuanto sale el iPhone 13?',
    'Quiero comprar uno',
    'Puedo pasar mañana a las 15hs?',
    'Cancelo el turno'
  ];

  for (const msg of testMessages) {
    const intent = await ai.analyzeIntent(msg);
    console.log(`"${msg}" → ${intent}`);
  }
  console.log('\n---\n');

  // Test 4: Extracción de información
  console.log('Test 4: Extracción de información de producto');
  const extractionTests = [
    'Busco un iPhone 13 Pro de 128gb',
    'Tenes algo en azul?',
    'Tengo hasta 50 mil de presupuesto'
  ];

  for (const msg of extractionTests) {
    const info = await ai.extractProductInfo(msg);
    console.log(`"${msg}"`);
    console.log('Extraído:', JSON.stringify(info, null, 2));
    console.log('');
  }

  console.log('✅ Tests completados');
}

testAI().catch(console.error);
