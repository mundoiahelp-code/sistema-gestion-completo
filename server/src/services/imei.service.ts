/**
 * Servicio de consulta de IMEI usando APIs externas
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

// Intentar múltiples APIs de IMEI
async function tryImeiApis(imei: string): Promise<ImeiInfo | null> {
  const apis = [
    // API 1: imei.info (requiere scraping pero es gratis)
    async () => {
      try {
        const response = await axios.get(`https://www.imei.info/api/check/${imei}`, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.data && response.data.device) {
          const device = response.data.device;
          return {
            model: device.model || device.name || '',
            brand: device.brand || 'Apple',
            color: device.color,
            storage: device.storage,
            found: true,
            source: 'imei.info'
          };
        }
      } catch (error) {
        console.log('imei.info no disponible');
      }
      return null;
    },
    
    // API 2: imeipro.info
    async () => {
      try {
        const response = await axios.post('https://imeipro.info/check', 
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
          return {
            model: response.data.model,
            brand: response.data.brand || 'Apple',
            color: response.data.color,
            storage: response.data.storage,
            found: true,
            source: 'imeipro.info'
          };
        }
      } catch (error) {
        console.log('imeipro.info no disponible');
      }
      return null;
    },

    // API 3: imei24.com
    async () => {
      try {
        const response = await axios.get(`https://imei24.com/api/check?imei=${imei}`, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });
        
        if (response.data && response.data.device) {
          return {
            model: response.data.device.model || '',
            brand: response.data.device.brand || 'Apple',
            color: response.data.device.color,
            storage: response.data.device.storage,
            found: true,
            source: 'imei24.com'
          };
        }
      } catch (error) {
        console.log('imei24.com no disponible');
      }
      return null;
    },

    // API 4: Usar TAC database público
    async () => {
      try {
        const tac = imei.substring(0, 8);
        const response = await axios.get(`https://tac-database.com/api/tac/${tac}`, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });
        
        if (response.data && response.data.model) {
          return {
            model: response.data.model,
            brand: response.data.brand || 'Apple',
            found: true,
            source: 'tac-database'
          };
        }
      } catch (error) {
        console.log('tac-database no disponible');
      }
      return null;
    }
  ];

  // Intentar todas las APIs en paralelo
  const results = await Promise.allSettled(apis.map(api => api()));
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
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
  
  console.log(`🔍 Buscando IMEI: ${imei}`);
  
  // Intentar APIs externas
  const apiResult = await tryImeiApis(imei);
  if (apiResult) {
    console.log(`✅ IMEI encontrado en ${apiResult.source}: ${apiResult.model}`);
    return apiResult;
  }
  
  console.log('❌ IMEI no encontrado en ninguna API');
  // No encontrado
  return { model: '', found: false, source: 'not_found' };
}

export const imeiService = {
  lookup: lookupImeiInfo,
};
