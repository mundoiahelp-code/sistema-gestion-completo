import axios from 'axios';
import { config } from '../config/config.js';

class BackendIntegration {
  constructor() {
    this.baseURL = config.backend.url;
    this.tenantId = process.env.TENANT_ID;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': this.tenantId, // Usar tenant ID en lugar de token
      },
    });
    // Cache para no bombardear el backend
    this.cache = {
      stock: { data: null, timestamp: 0 },
      stores: { data: null, timestamp: 0 },
      accessories: { data: null, timestamp: 0 },
      tenant: { data: null, timestamp: 0 }
    };
    this.cacheTTL = 10000; // 10 segundos (antes era 60 segundos)
  }

  // Invalidar todo el cache (cuando se actualiza configuración)
  invalidateCache() {
    console.log('🔄 Invalidando caché del bot...');
    this.cache = {
      stock: { data: null, timestamp: 0 },
      stores: { data: null, timestamp: 0 },
      accessories: { data: null, timestamp: 0 },
      tenant: { data: null, timestamp: 0 }
    };
  }

  // Verificar si el cache es válido
  isCacheValid(key) {
    return this.cache[key].data && (Date.now() - this.cache[key].timestamp) < this.cacheTTL;
  }

  // Obtener stock real del sistema (celulares)
  async getStock(filters = {}) {
    try {
      // Si no hay filtros y el cache es válido, usar cache
      if (Object.keys(filters).length === 0 && this.isCacheValid('stock')) {
        return this.cache.stock.data;
      }
      
      const result = await this.client.get('/products', { 
        params: { ...filters, category: 'PHONE', limit: 100 } 
      });
      const products = result.data.products || [];
      
      // Guardar en cache si no hay filtros
      if (Object.keys(filters).length === 0) {
        this.cache.stock = { data: products, timestamp: Date.now() };
      }
      
      return products;
    } catch (error) {
      console.error('Error obteniendo stock:', error.message);
      return [];
    }
  }

  // Obtener accesorios
  async getAccessories(filters = {}) {
    try {
      if (Object.keys(filters).length === 0 && this.isCacheValid('accessories')) {
        return this.cache.accessories.data;
      }
      
      const result = await this.client.get('/products', { 
        params: { ...filters, category: 'ACCESSORY', limit: 100 } 
      });
      const products = result.data.products || [];
      
      if (Object.keys(filters).length === 0) {
        this.cache.accessories = { data: products, timestamp: Date.now() };
      }
      
      return products;
    } catch (error) {
      console.error('Error obteniendo accesorios:', error.message);
      return [];
    }
  }

  // Obtener TODO el stock (celulares + accesorios)
  async getAllProducts(filters = {}) {
    try {
      const result = await this.client.get('/products', { 
        params: { ...filters, limit: 200 } 
      });
      return result.data.products || [];
    } catch (error) {
      console.error('Error obteniendo productos:', error.message);
      return [];
    }
  }

  // Buscar productos por modelo
  async searchProducts(query) {
    try {
      const result = await this.client.get('/products', {
        params: { search: query, limit: 50 },
      });
      return result.data.products || [];
    } catch (error) {
      console.error('Error buscando productos:', error.message);
      return [];
    }
  }

  // Obtener sucursales
  async getStores() {
    try {
      if (this.isCacheValid('stores')) {
        return this.cache.stores.data;
      }
      
      const result = await this.client.get('/stores');
      const stores = result.data.stores || [];
      
      this.cache.stores = { data: stores, timestamp: Date.now() };
      return stores;
    } catch (error) {
      console.error('Error obteniendo sucursales:', error.message);
      return [];
    }
  }

  // Obtener detalle de una sucursal con su stock
  async getStoreDetail(storeId) {
    try {
      const result = await this.client.get(`/stores/${storeId}`);
      return result.data.store || null;
    } catch (error) {
      console.error('Error obteniendo sucursal:', error.message);
      return null;
    }
  }

  // Obtener stock por sucursal
  async getStockByStore(storeId) {
    try {
      const result = await this.client.get('/products', {
        params: { storeId, limit: 100 }
      });
      return result.data.products || [];
    } catch (error) {
      console.error('Error obteniendo stock por sucursal:', error.message);
      return [];
    }
  }

  // Buscar producto por IMEI
  async lookupImei(imei) {
    try {
      const result = await this.client.get(`/products/imei/${imei}`);
      return result.data;
    } catch (error) {
      console.error('Error buscando IMEI:', error.message);
      return { found: false };
    }
  }

  // Reservar producto
  async reserveProduct(productId, reserved = true) {
    try {
      const result = await this.client.patch(`/products/reserve/${productId}`, {
        reserved: reserved ? 1 : 0
      });
      return result.data;
    } catch (error) {
      console.error('Error reservando producto:', error.message);
      return null;
    }
  }

  // Obtener contexto completo para el bot (stock + sucursales + info)
  async getFullContext() {
    try {
      const [phones, accessories, stores] = await Promise.all([
        this.getStock(),
        this.getAccessories(),
        this.getStores()
      ]);

      return {
        phones,
        accessories,
        stores,
        totalPhones: phones.length,
        totalAccessories: accessories.length,
        totalStores: stores.length
      };
    } catch (error) {
      console.error('Error obteniendo contexto completo:', error.message);
      return {
        phones: [],
        accessories: [],
        stores: [],
        totalPhones: 0,
        totalAccessories: 0,
        totalStores: 0
      };
    }
  }

  // Formatear stock para el prompt del bot
  async formatStockForPrompt(phones, accessories, stores) {
    let context = '';

    // Información del negocio (siempre actualizada)
    const businessInfo = await this.getBusinessInfo();
    context += businessInfo;

    // Sucursales
    if (stores && stores.length > 0) {
      context += '\n\nSUCURSALES:';
      stores.forEach(store => {
        context += `\n- ${store.name}${store.address ? ` (${store.address})` : ''}${store.phone ? ` - Tel: ${store.phone}` : ''}`;
      });
    }

    // Celulares
    if (phones && phones.length > 0) {
      context += '\n\nCELULARES EN STOCK:';
      const grouped = this.groupProducts(phones);
      Object.entries(grouped).forEach(([modelo, data]) => {
        const colors = data.colors.length > 0 ? data.colors.join('/') : 'varios';
        const battery = data.battery ? ` (${data.battery}% bat)` : '';
        const store = data.store ? ` [${data.store}]` : '';
        context += `\n${modelo} - ${colors} - ${data.priceUSD}usd${battery}${store}`;
      });
    } else {
      context += '\n\nCELULARES: No hay stock cargado';
    }

    // Accesorios
    if (accessories && accessories.length > 0) {
      context += '\n\nACCESORIOS (fundas, cargadores, auriculares, cables):';
      const grouped = this.groupProducts(accessories);
      Object.entries(grouped).forEach(([modelo, data]) => {
        const colors = data.colors.length > 0 ? data.colors.join('/') : 'varios';
        context += `\n${modelo} - ${colors} - ${data.priceUSD}usd (stock: ${data.stock})`;
      });
    }

    return context;
  }

  // Agrupar productos por modelo
  groupProducts(products) {
    const grouped = {};
    products.forEach((item) => {
      const modelo = item.model || item.name || '';
      const storage = item.storage || '';
      const color = item.color || '';
      const battery = item.battery || '';
      const price = item.price || 0;
      const priceUSD = price < 10000 ? price : Math.round(price / 1200); // Si es muy alto, convertir de ARS a USD
      const storeName = item.store?.name || '';
      
      const key = `${modelo}${storage ? ' ' + storage : ''}`.trim();
      if (!grouped[key]) {
        grouped[key] = { colors: [], priceUSD, battery, stock: 0, store: storeName };
      }
      if (color && !grouped[key].colors.includes(color)) {
        grouped[key].colors.push(color);
      }
      grouped[key].stock += item.stock || 1;
    });
    return grouped;
  }

  // Normalizar número de teléfono para evitar duplicados
  normalizePhoneNumber(phone) {
    // Remover todos los sufijos de WhatsApp
    let normalized = phone.replace(/@s\.whatsapp\.net|@lid|@g\.us|@c\.us/g, '');
    
    // Remover espacios, guiones y otros caracteres
    normalized = normalized.replace(/[\s\-\(\)]/g, '');
    
    // Si empieza con +, removerlo
    normalized = normalized.replace(/^\+/, '');
    
    // Asegurar que solo contenga números
    normalized = normalized.replace(/\D/g, '');
    
    return normalized;
  }

  // Registrar mensaje de chat
  async logChatMessage(customerPhone, message, response, intent, status = 'responded', customerName = null) {
    try {
      // Normalizar el número de teléfono para evitar duplicados
      const cleanPhone = this.normalizePhoneNumber(customerPhone);
      
      const payload = {
        customerPhone: cleanPhone,
        originalJid: customerPhone, // Guardar el JID original (puede tener @lid)
        message,
        response,
        intent,
        status
      };

      // Si viene customerName (pushName de WhatsApp), agregarlo
      if (customerName) {
        payload.customerName = customerName;
      }

      console.log('📝 Guardando mensaje en backend:', { customerPhone: cleanPhone, intent, customerName });
      const result = await this.client.post('/bot/messages', payload);
      console.log('✅ Mensaje guardado en backend');
      return result.data;
    } catch (error) {
      console.error('❌ Error registrando mensaje en backend:', error.message);
      if (error.response) {
        console.error('Detalles:', error.response.data);
      }
      return null;
    }
  }

  // Obtener configuración del bot
  async getBotConfig() {
    try {
      const result = await this.client.get('/bot/public/config');
      return result.data.config;
    } catch (error) {
      console.error('Error obteniendo configuración del bot:', error.message);
      return null;
    }
  }

  // Obtener configuración del tenant (negocio) en tiempo real
  async getTenantConfig() {
    try {
      // Usar cache solo si es reciente (10 segundos)
      if (this.isCacheValid('tenant')) {
        return this.cache.tenant.data;
      }

      const result = await this.client.get('/tenants/current');
      const tenant = result.data.tenant;
      
      // Guardar en cache
      this.cache.tenant = { data: tenant, timestamp: Date.now() };
      
      return tenant;
    } catch (error) {
      console.error('Error obteniendo configuración del tenant:', error.message);
      return null;
    }
  }

  // Obtener información completa para el prompt del bot
  async getBusinessInfo() {
    try {
      const tenant = await this.getTenantConfig();
      if (!tenant) return '';

      let info = `\n\nINFORMACIÓN DEL NEGOCIO:`;
      info += `\nNombre: ${tenant.name}`;
      
      if (tenant.whatsapp) {
        info += `\nWhatsApp: ${tenant.whatsapp}`;
      }
      
      if (tenant.whatsappAsesor) {
        info += `\nWhatsApp Asesor: ${tenant.whatsappAsesor}`;
      }

      if (tenant.instagram) {
        info += `\nInstagram: ${tenant.instagram}`;
      }

      if (tenant.website) {
        info += `\nSitio web: ${tenant.website}`;
      }

      // Métodos de pago
      if (tenant.botPaymentMethods) {
        const methods = tenant.botPaymentMethods.split(',').filter(Boolean);
        if (methods.length > 0) {
          info += `\nMétodos de pago: ${methods.join(', ')}`;
        }
      }

      // Garantía
      if (tenant.botWarrantyDays) {
        info += `\nGarantía: ${tenant.botWarrantyDays} días`;
      }

      // Envíos
      if (tenant.botShipsOrders) {
        info += `\nHacemos envíos: Sí`;
        if (tenant.shippingZones) {
          info += `\nZonas de envío: ${tenant.shippingZones}`;
        }
        if (tenant.shippingTime) {
          info += `\nTiempo de entrega: ${tenant.shippingTime}`;
        }
      } else {
        info += `\nHacemos envíos: No`;
      }

      // Seña/Reserva
      if (tenant.reservationDeposit) {
        info += `\nSeña para reservar: ${tenant.reservationDeposit}`;
      }

      // Política de devoluciones
      if (tenant.returnPolicy) {
        info += `\nPolítica de devoluciones: ${tenant.returnPolicy}`;
      }

      return info;
    } catch (error) {
      console.error('Error obteniendo info del negocio:', error.message);
      return '';
    }
  }

  // Verificar si el bot está activo Y si el plan permite bot IA
  async isBotActive() {
    try {
      console.log('🔍 Verificando estado del bot...');
      
      // Verificar plan del tenant
      const tenant = await this.getTenantConfig();
      if (!tenant) {
        console.log('⚠️  No se pudo obtener config del tenant - bot inactivo');
        return false;
      }

      console.log(`📋 Plan del tenant: ${tenant.plan} (tipo: ${typeof tenant.plan})`);

      // Solo plan PRO tiene bot IA automático (case insensitive)
      const planLower = (tenant.plan || '').toLowerCase();
      if (planLower !== 'pro') {
        console.log(`⚠️  Plan ${tenant.plan} no tiene bot IA (solo PRO)`);
        return false;
      }

      // Verificar si el bot está activo en la configuración
      const config = await this.getBotConfig();
      console.log('📋 Config del bot:', JSON.stringify(config));
      const isActive = config?.isActive !== false; // Por defecto activo si no hay config
      
      console.log(`🤖 Bot ${isActive ? 'ACTIVO ✅' : 'INACTIVO ❌'} en configuración`);
      return isActive;
    } catch (error) {
      console.error('❌ Error verificando estado del bot:', error.message);
      console.error('Stack:', error.stack);
      return false; // Por defecto INACTIVO si hay error
    }
  }

  // Verificar horarios de trabajo - SIEMPRE ACTIVO 24/7
  async isWithinWorkingHours() {
    // Bot activo 24/7
    return true;
  }

  // Obtener delay de respuesta configurado
  async getResponseDelay() {
    try {
      const config = await this.getBotConfig();
      return (config?.responseDelay || 2) * 1000; // Convertir a milisegundos
    } catch (error) {
      console.error('Error obteniendo delay:', error.message);
      return 2000; // 2 segundos por defecto
    }
  }

  // Verificar límite de mensajes por minuto
  async checkRateLimit(customerPhone) {
    try {
      // Aquí podrías implementar lógica de rate limiting
      // Por ahora retornamos true (permitido)
      return true;
    } catch (error) {
      console.error('Error verificando rate limit:', error.message);
      return true;
    }
  }

  // Obtener personalidad del bot
  async getBotPersonality() {
    try {
      const config = await this.getBotConfig();
      return config?.personality || {
        tone: 'friendly',
        style: 'argentinian',
        useEmojis: true
      };
    } catch (error) {
      console.error('Error obteniendo personalidad:', error.message);
      return {
        tone: 'friendly',
        style: 'argentinian',
        useEmojis: true
      };
    }
  }

  // Registrar escalamiento a humano
  async escalateToHuman(customerPhone, reason, context) {
    try {
      const payload = {
        customerPhone,
        message: `[ESCALADO] ${reason}`,
        response: 'Escalado a atención humana',
        intent: 'ESCALATED',
        status: 'escalated'
      };

      const result = await this.client.post('/bot/messages', payload);
      console.log(`🚨 Escalado a humano - Cliente: ${customerPhone}, Razón: ${reason}`);
      return result.data;
    } catch (error) {
      console.error('Error escalando a humano:', error.message);
      return null;
    }
  }

  // Actualizar estadísticas del bot
  async updateBotStats(stats) {
    try {
      // Aquí podrías enviar estadísticas adicionales al backend
      console.log('📊 Estadísticas del bot:', stats);
    } catch (error) {
      console.error('Error actualizando estadísticas:', error.message);
    }
  }

  // Obtener contexto de conversación
  async getConversationContext(customerPhone) {
    try {
      // Por ahora retornamos null, pero podrías implementar
      // persistencia de contexto en el backend
      return null;
    } catch (error) {
      console.error('Error obteniendo contexto:', error.message);
      return null;
    }
  }

  // Guardar contexto de conversación
  async saveConversationContext(customerPhone, context) {
    try {
      // Implementar guardado de contexto en el backend
      console.log(`💾 Guardando contexto para ${customerPhone}`);
    } catch (error) {
      console.error('Error guardando contexto:', error.message);
    }
  }
}

export default BackendIntegration;