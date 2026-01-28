/**
 * Servicio de consulta de IMEI usando web scraping simple de IMEI.info
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

// Scraping simple de IMEI.info usando regex (sin dependencias extra)
async function scrapeImeiInfo(imei: string): Promise<ImeiInfo | null> {
  try {
    console.log(`🔍 Scraping IMEI.info para: ${imei}`);
    
    const response = await axios.get(`https://www.imei.info/phonedatabase/${imei}/`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      }
    });

    const html = response.data;
    
    // Buscar el título del modelo usando regex (ej: <h1>IPHONE 14 PRO</h1>)
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    
    if (h1Match && h1Match[1]) {
      // Limpiar HTML tags y formatear
      let model = h1Match[1]
        .replace(/<[^>]*>/g, '') // Remover tags HTML
        .replace(/&nbsp;/g, ' ') // Remover &nbsp;
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
      
      // Capitalizar correctamente (iPhone en vez de IPHONE)
      if (model.toUpperCase().includes('IPHONE')) {
        model = model.replace(/IPHONE/gi, 'iPhone');
      }
      
      console.log(`✅ Modelo encontrado: ${model}`);
      
      return {
        model,
        brand: 'Apple',
        found: true,
        source: 'imei.info'
      };
    }
    
    console.log('❌ No se encontró el modelo en la página');
    return null;
  } catch (error: any) {
    console.error('Error scraping IMEI.info:', error.message);
    return null;
  }
}

// Función principal de lookup
export async function lookupImeiInfo(imei: string): Promise<ImeiInfo> {
  // Validar IMEI
  if (!imei || imei.length !== 15 || !/^\d+$/.test(imei)) {
    return { model: '', found: false, source: 'invalid' };
  }
  
  console.log(`🔍 Buscando IMEI: ${imei}`);
  
  // Intentar scraping de IMEI.info
  const result = await scrapeImeiInfo(imei);
  if (result) {
    console.log(`✅ IMEI encontrado: ${result.model}`);
    return result;
  }
  
  console.log('❌ IMEI no encontrado');
  return { model: '', found: false, source: 'not_found' };
}

export const imeiService = {
  lookup: lookupImeiInfo,
};
