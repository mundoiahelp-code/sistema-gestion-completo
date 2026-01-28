/**
 * Servicio de consulta de IMEI usando múltiples métodos
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

// Método 1: Usar API pública de imei-checker.net
async function tryImeiCheckerApi(imei: string): Promise<ImeiInfo | null> {
  try {
    console.log(`🔍 Intentando imei-checker.net API para: ${imei}`);
    
    const response = await axios.post('https://imei-checker.net/api/check', 
      { imei },
      {
        timeout: 8000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    if (response.data && response.data.model) {
      console.log(`✅ Encontrado en imei-checker.net: ${response.data.model}`);
      return {
        model: response.data.model,
        brand: response.data.brand || 'Apple',
        found: true,
        source: 'imei-checker.net'
      };
    }
  } catch (error: any) {
    console.log('imei-checker.net no disponible:', error.message);
  }
  return null;
}

// Método 2: Scraping simple de IMEI.info
async function scrapeImeiInfo(imei: string): Promise<ImeiInfo | null> {
  try {
    console.log(`🔍 Scraping IMEI.info para: ${imei}`);
    
    const response = await axios.get(`https://www.imei.info/phonedatabase/${imei}/`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://www.imei.info/',
      }
    });

    const html = response.data;
    
    // Intentar múltiples patrones de regex
    const patterns = [
      /<h1[^>]*>(.*?)<\/h1>/i,
      /<title>(.*?)<\/title>/i,
      /<meta\s+property="og:title"\s+content="(.*?)"/i,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let model = match[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/\s*-\s*IMEI\.info/gi, '')
          .replace(/IMEI\.info/gi, '')
          .trim();
        
        // Capitalizar iPhone correctamente
        if (model.toUpperCase().includes('IPHONE')) {
          model = model.replace(/IPHONE/gi, 'iPhone');
        }
        
        if (model.length > 3) {
          console.log(`✅ Modelo encontrado en IMEI.info: ${model}`);
          return {
            model,
            brand: 'Apple',
            found: true,
            source: 'imei.info'
          };
        }
      }
    }
    
    console.log('❌ No se encontró el modelo en IMEI.info');
  } catch (error: any) {
    console.error('Error scraping IMEI.info:', error.message);
  }
  return null;
}

// Método 3: Base de datos TAC básica (fallback)
function lookupBasicTac(imei: string): ImeiInfo | null {
  const tac = imei.substring(0, 8);
  
  // Solo algunos TAC comunes como fallback
  const basicTacDb: { [key: string]: string } = {
    '35971228': 'iPhone 14 Pro',
    '35971229': 'iPhone 14 Pro Max',
    '35971122': 'iPhone 13 Pro',
    '35971123': 'iPhone 13 Pro Max',
  };
  
  const model = basicTacDb[tac];
  if (model) {
    console.log(`✅ Modelo encontrado en TAC básico: ${model}`);
    return {
      model,
      brand: 'Apple',
      found: true,
      source: 'tac-basic'
    };
  }
  
  return null;
}

// Función principal de lookup
export async function lookupImeiInfo(imei: string): Promise<ImeiInfo> {
  // Validar IMEI
  if (!imei || imei.length !== 15 || !/^\d+$/.test(imei)) {
    return { model: '', found: false, source: 'invalid' };
  }
  
  console.log(`🔍 Buscando IMEI: ${imei}`);
  
  // Intentar API primero
  const apiResult = await tryImeiCheckerApi(imei);
  if (apiResult) {
    return apiResult;
  }
  
  // Intentar scraping de IMEI.info
  const scrapeResult = await scrapeImeiInfo(imei);
  if (scrapeResult) {
    return scrapeResult;
  }
  
  // Fallback a TAC básico
  const tacResult = lookupBasicTac(imei);
  if (tacResult) {
    return tacResult;
  }
  
  console.log('❌ IMEI no encontrado en ninguna fuente');
  return { model: '', found: false, source: 'not_found' };
}

export const imeiService = {
  lookup: lookupImeiInfo,
};
