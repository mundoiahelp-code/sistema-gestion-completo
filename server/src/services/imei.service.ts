/**
 * Servicio de consulta de IMEI
 * Intenta obtener información del dispositivo desde múltiples fuentes
 */

import axios from 'axios';

interface ImeiInfo {
  model: string;
  brand?: string;
  color?: string;
  storage?: string;
  found: boolean;
  source: string;
}

// Base de datos extendida de TAC codes de Apple
// TAC = Type Allocation Code (primeros 8 dígitos del IMEI)
const appleTacDatabase: { [key: string]: { model: string; storage?: string } } = {
  // iPhone 16 Series (2024)
  '35932816': { model: 'iPhone 16 Pro Max' },
  '35931816': { model: 'iPhone 16 Pro' },
  '35930816': { model: 'iPhone 16 Plus' },
  '35929816': { model: 'iPhone 16' },
  '35474416': { model: 'iPhone 16 Pro Max' },
  '35474316': { model: 'iPhone 16 Pro' },
  '35474216': { model: 'iPhone 16 Plus' },
  '35474116': { model: 'iPhone 16' },
  
  // iPhone 15 Series (2023)
  '35327515': { model: 'iPhone 15 Pro Max' },
  '35327615': { model: 'iPhone 15 Pro Max' },
  '35326515': { model: 'iPhone 15 Pro' },
  '35326615': { model: 'iPhone 15 Pro' },
  '35325515': { model: 'iPhone 15 Plus' },
  '35324515': { model: 'iPhone 15' },
  '35473315': { model: 'iPhone 15 Pro Max' },
  '35473415': { model: 'iPhone 15 Pro Max' },
  '35472315': { model: 'iPhone 15 Pro' },
  '35472415': { model: 'iPhone 15 Pro' },
  '35471315': { model: 'iPhone 15 Plus' },
  '35470315': { model: 'iPhone 15' },
  '35919915': { model: 'iPhone 15 Pro Max' },
  '35918915': { model: 'iPhone 15 Pro' },
  '35917915': { model: 'iPhone 15 Plus' },
  '35916915': { model: 'iPhone 15' },
  
  // iPhone 14 Series (2022)
  '35391114': { model: 'iPhone 14 Pro Max' },
  '35391214': { model: 'iPhone 14 Pro Max' },
  '35390114': { model: 'iPhone 14 Pro' },
  '35390214': { model: 'iPhone 14 Pro' },
  '35389114': { model: 'iPhone 14 Plus' },
  '35388114': { model: 'iPhone 14' },
  '35473214': { model: 'iPhone 14 Pro Max' },
  '35472214': { model: 'iPhone 14 Pro' },
  '35471214': { model: 'iPhone 14 Plus' },
  '35470214': { model: 'iPhone 14' },
  '35284014': { model: 'iPhone 14 Pro Max' },
  '35283014': { model: 'iPhone 14 Pro' },
  '35282014': { model: 'iPhone 14 Plus' },
  '35281014': { model: 'iPhone 14' },
  
  // iPhone 13 Series (2021)
  '35847013': { model: 'iPhone 13 Pro Max' },
  '35847113': { model: 'iPhone 13 Pro Max' },
  '35846013': { model: 'iPhone 13 Pro' },
  '35846113': { model: 'iPhone 13 Pro' },
  '35845013': { model: 'iPhone 13' },
  '35845113': { model: 'iPhone 13' },
  '35844013': { model: 'iPhone 13 Mini' },
  '35844113': { model: 'iPhone 13 Mini' },
  '35473113': { model: 'iPhone 13 Pro Max' },
  '35472113': { model: 'iPhone 13 Pro' },
  '35471113': { model: 'iPhone 13' },
  '35470113': { model: 'iPhone 13 Mini' },
  '35309513': { model: 'iPhone 13 Pro Max' },
  '35308513': { model: 'iPhone 13 Pro' },
  '35307513': { model: 'iPhone 13' },
  '35306513': { model: 'iPhone 13 Mini' },
  
  // iPhone 12 Series (2020)
  '35397912': { model: 'iPhone 12 Pro Max' },
  '35396912': { model: 'iPhone 12 Pro' },
  '35395912': { model: 'iPhone 12' },
  '35394912': { model: 'iPhone 12 Mini' },
  '35473012': { model: 'iPhone 12 Pro Max' },
  '35472012': { model: 'iPhone 12 Pro' },
  '35471012': { model: 'iPhone 12' },
  '35470012': { model: 'iPhone 12 Mini' },
  '35397812': { model: 'iPhone 12 Pro Max' },
  '35396812': { model: 'iPhone 12 Pro' },
  '35395812': { model: 'iPhone 12' },
  '35394812': { model: 'iPhone 12 Mini' },
  
  // iPhone 11 Series (2019)
  '35391911': { model: 'iPhone 11 Pro Max' },
  '35390911': { model: 'iPhone 11 Pro' },
  '35389911': { model: 'iPhone 11' },
  '35388911': { model: 'iPhone 11' },
  '35319711': { model: 'iPhone 11 Pro Max' },
  '35318711': { model: 'iPhone 11 Pro' },
  '35317711': { model: 'iPhone 11' },
  
  // iPhone XS/XR/X Series (2018-2017)
  '35391810': { model: 'iPhone XS Max' },
  '35390810': { model: 'iPhone XS' },
  '35389810': { model: 'iPhone XR' },
  '35388810': { model: 'iPhone X' },
  '35325410': { model: 'iPhone XS Max' },
  '35324410': { model: 'iPhone XS' },
  '35323410': { model: 'iPhone XR' },
  '35322410': { model: 'iPhone X' },
  
  // iPhone SE Series
  '35392322': { model: 'iPhone SE 3' },
  '35391320': { model: 'iPhone SE 2' },
  '35390320': { model: 'iPhone SE 2' },
  '35474022': { model: 'iPhone SE 3' },
  '35473920': { model: 'iPhone SE 2' },
  
  // iPhone 8 Series (2017)
  '35387808': { model: 'iPhone 8 Plus' },
  '35386808': { model: 'iPhone 8' },
  '35319508': { model: 'iPhone 8 Plus' },
  '35318508': { model: 'iPhone 8' },
  
  // iPhone 7 Series (2016)
  '35385707': { model: 'iPhone 7 Plus' },
  '35384707': { model: 'iPhone 7' },
  '35319407': { model: 'iPhone 7 Plus' },
  '35318407': { model: 'iPhone 7' },
};

// Intentar obtener info de API externa gratuita
async function tryExternalApi(imei: string): Promise<ImeiInfo | null> {
  try {
    // Intentar con imeidb.xyz (gratuito, limitado)
    const response = await axios.get(`https://api.imeidb.xyz/v1/check/${imei}`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (response.data && response.data.brand) {
      return {
        model: response.data.model || response.data.name || '',
        brand: response.data.brand,
        color: response.data.color,
        storage: response.data.storage,
        found: true,
        source: 'api'
      };
    }
  } catch (error) {
    // API no disponible o error, continuar con TAC
    console.log('API externa no disponible, usando TAC database');
  }
  
  return null;
}

// Buscar en base de datos local de TAC
function lookupTac(imei: string): ImeiInfo | null {
  const tac = imei.substring(0, 8);
  const tacInfo = appleTacDatabase[tac];
  
  if (tacInfo) {
    return {
      model: tacInfo.model,
      brand: 'Apple',
      storage: tacInfo.storage,
      found: true,
      source: 'tac'
    };
  }
  
  // Intentar con 7 dígitos (algunos TAC son más cortos)
  const tac7 = imei.substring(0, 7);
  for (const [key, value] of Object.entries(appleTacDatabase)) {
    if (key.startsWith(tac7)) {
      return {
        model: value.model,
        brand: 'Apple',
        storage: value.storage,
        found: true,
        source: 'tac'
      };
    }
  }
  
  return null;
}

// Función principal de lookup
export async function lookupImeiInfo(imei: string): Promise<ImeiInfo> {
  // Validar IMEI
  if (!imei || imei.length !== 15 || !/^\d+$/.test(imei)) {
    return { model: '', found: false, source: 'invalid' };
  }
  
  // Primero intentar API externa (más completa)
  const apiResult = await tryExternalApi(imei);
  if (apiResult) {
    return apiResult;
  }
  
  // Fallback a base de datos TAC local
  const tacResult = lookupTac(imei);
  if (tacResult) {
    return tacResult;
  }
  
  // No encontrado
  return { model: '', found: false, source: 'not_found' };
}

export const imeiService = {
  lookup: lookupImeiInfo,
  lookupTac,
};
