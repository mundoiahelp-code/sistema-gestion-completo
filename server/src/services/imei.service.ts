/**
 * Servicio de consulta de IMEI usando API confiable
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

// Usar API de imeicheck.com (gratuita y confiable)
async function lookupImeiCheck(imei: string): Promise<ImeiInfo | null> {
  try {
    console.log(`🔍 Consultando imeicheck.com para IMEI: ${imei}`);
    
    const response = await axios.get(`https://imeicheck.com/api/check/${imei}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (response.data && response.data.device) {
      const device = response.data.device;
      const model = device.model || device.name || '';
      
      if (model) {
        console.log(`✅ Modelo encontrado: ${model}`);
        return {
          model,
          brand: device.brand || 'Apple',
          found: true,
          source: 'imeicheck.com'
        };
      }
    }
  } catch (error: any) {
    console.error('Error en imeicheck.com:', error.message);
  }
  return null;
}

// Usar API de imeipro.info
async function lookupImeiPro(imei: string): Promise<ImeiInfo | null> {
  try {
    console.log(`🔍 Consultando imeipro.info para IMEI: ${imei}`);
    
    const response = await axios.get(`https://imeipro.info/check.php?imei=${imei}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (response.data && response.data.model) {
      console.log(`✅ Modelo encontrado: ${response.data.model}`);
      return {
        model: response.data.model,
        brand: response.data.brand || 'Apple',
        found: true,
        source: 'imeipro.info'
      };
    }
  } catch (error: any) {
    console.error('Error en imeipro.info:', error.message);
  }
  return null;
}

// Usar API de imei24.com
async function lookupImei24(imei: string): Promise<ImeiInfo | null> {
  try {
    console.log(`🔍 Consultando imei24.com para IMEI: ${imei}`);
    
    const response = await axios.get(`https://api.imei24.com/v1/check/${imei}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (response.data && response.data.device && response.data.device.model) {
      console.log(`✅ Modelo encontrado: ${response.data.device.model}`);
      return {
        model: response.data.device.model,
        brand: response.data.device.brand || 'Apple',
        found: true,
        source: 'imei24.com'
      };
    }
  } catch (error: any) {
    console.error('Error en imei24.com:', error.message);
  }
  return null;
}

// Función principal de lookup
export async function lookupImeiInfo(imei: string): Promise<ImeiInfo> {
  // Validar IMEI
  if (!imei || imei.length !== 15 || !/^\d+$/.test(imei)) {
    console.log('❌ IMEI inválido');
    return { model: '', found: false, source: 'invalid' };
  }
  
  console.log(`🔍 Iniciando búsqueda de IMEI: ${imei}`);
  
  // Intentar las 3 APIs en paralelo para ser más rápido
  const results = await Promise.allSettled([
    lookupImeiCheck(imei),
    lookupImeiPro(imei),
    lookupImei24(imei),
  ]);
  
  // Retornar el primer resultado exitoso
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }
  
  console.log('❌ IMEI no encontrado en ninguna API');
  return { model: '', found: false, source: 'not_found' };
}

export const imeiService = {
  lookup: lookupImeiInfo,
};
