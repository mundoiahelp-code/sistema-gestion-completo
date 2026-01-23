import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma';
import { whatsappService } from './whatsapp.service';

// Tipo para la configuración del tenant
interface TenantConfig {
  id: string;
  name: string;
  botTone: string;
  botLanguage: string;
  botGreeting?: string | null;
  botFarewell?: string | null;
  botExtraInfo?: string | null;
  botWarrantyDays: number;
  botShipsOrders: boolean;
  botPaymentMethods: string;
  botWorkingHours?: string | null;
  botLocation?: string | null;
  whatsappAsesor?: string | null;
  shippingZones?: string | null;
  shippingTime?: string | null;
  returnPolicy?: string | null;
  reservationDeposit?: string | null;
  instagram?: string | null;
  website?: string | null;
  whatsapp?: string | null;
}

// Configuración por defecto
const DEFAULT_TENANT_CONFIG: TenantConfig = {
  id: '',
  name: 'la tienda',
  botTone: 'amigable',
  botLanguage: 'argentino',
  botWarrantyDays: 30,
  botShipsOrders: false,
  botPaymentMethods: 'efectivo,transferencia,usdt',
};

// Cache del tenant actual (se actualiza cuando se conecta WhatsApp)
let currentTenantId: string | null = null;
let currentTenantConfig: TenantConfig | null = null;

// Función para obtener el tenant por el número de WhatsApp del negocio
async function getTenantByWhatsAppNumber(): Promise<{ id: string; config: TenantConfig } | null> {
  try {
    // Si ya tenemos el tenant en cache, usarlo
    if (currentTenantId && currentTenantConfig) {
      return { id: currentTenantId, config: currentTenantConfig };
    }

    // Obtener el número del negocio desde WhatsApp
    const businessPhone = whatsappService.getBusinessPhoneNumber();
    
    let tenant = null;
    
    // Si tenemos el número, buscar el tenant por ese número
    if (businessPhone) {
      tenant = await prisma.tenant.findFirst({
        where: {
          active: true,
          whatsapp: { contains: businessPhone.slice(-10) } // Últimos 10 dígitos
        }
      });
      
      if (tenant) {
        console.log(`🏢 Tenant identificado por WhatsApp: ${tenant.name}`);
      }
    }
    
    // Si no encontramos por WhatsApp, usar el primer tenant activo (fallback)
    if (!tenant) {
      tenant = await prisma.tenant.findFirst({
        where: { active: true }
      });
      
      if (tenant) {
        console.log(`🏢 Usando tenant por defecto: ${tenant.name}`);
      }
    }

    if (!tenant) {
      return null;
    }

    // Construir la config
    const config: TenantConfig = {
      id: tenant.id,
      name: tenant.name,
      botTone: (tenant as any).botTone || 'amigable',
      botLanguage: (tenant as any).botLanguage || 'argentino',
      botGreeting: (tenant as any).botGreeting,
      botFarewell: (tenant as any).botFarewell,
      botExtraInfo: (tenant as any).botExtraInfo,
      botWarrantyDays: (tenant as any).botWarrantyDays || 30,
      botShipsOrders: (tenant as any).botShipsOrders || false,
      botPaymentMethods: (tenant as any).botPaymentMethods || 'efectivo,transferencia,usdt',
      botWorkingHours: (tenant as any).botWorkingHours,
      botLocation: (tenant as any).botLocation,
      whatsappAsesor: (tenant as any).whatsappAsesor,
      shippingZones: (tenant as any).shippingZones,
      shippingTime: (tenant as any).shippingTime,
      returnPolicy: (tenant as any).returnPolicy,
      reservationDeposit: (tenant as any).reservationDeposit,
      instagram: (tenant as any).instagram,
      website: (tenant as any).website,
      whatsapp: (tenant as any).whatsapp,
    };

    // Guardar en cache
    currentTenantId = tenant.id;
    currentTenantConfig = config;

    return { id: tenant.id, config };
  } catch (error) {
    console.error('Error obteniendo tenant:', error);
    return null;
  }
}

// Función para limpiar el cache del tenant (llamar cuando se desconecta WhatsApp)
function clearTenantCache() {
  currentTenantId = null;
  currentTenantConfig = null;
}

// Función para generar el prompt dinámico según la configuración del tenant
function getSystemPrompt(config: TenantConfig): string {
  // Determinar estilo de comunicación según botLanguage
  let estiloBase = '';
  let expresiones = '';
  
  if (config.botLanguage === 'argentino') {
    estiloBase = `Hablas como un pibe argentino real por whatsapp.`;
    expresiones = `- Usas: "dale", "joya", "sisi", "tranqui", "de una"`;
  } else if (config.botLanguage === 'formal') {
    estiloBase = `Hablas de manera profesional y cordial.`;
    expresiones = `- Usas: "perfecto", "con gusto", "por supuesto", "claro que sí"`;
  } else {
    estiloBase = `Hablas de manera natural y amigable.`;
    expresiones = `- Usas expresiones naturales y amigables`;
  }

  // Determinar tono
  let tonoExtra = '';
  if (config.botTone === 'amigable') {
    tonoExtra = `- Sé cercano y cálido, como hablando con un amigo`;
  } else if (config.botTone === 'formal') {
    tonoExtra = `- Mantené un tono profesional y respetuoso`;
  } else {
    tonoExtra = `- Mantené un tono equilibrado, ni muy formal ni muy informal`;
  }

  // Info de envíos
  const enviosInfo = config.botShipsOrders 
    ? `- Envíos: SÍ, hacemos envíos${config.shippingZones ? ` a ${config.shippingZones}` : ''}${config.shippingTime ? ` (${config.shippingTime})` : ''}` 
    : `- Envíos: NO, solo retiro en ${config.botLocation || 'sucursal'}`;

  // Métodos de pago
  const pagos = config.botPaymentMethods.split(',').map(p => p.trim()).join(', ');

  // Saludo personalizado
  const saludoEjemplo = config.botGreeting || 'buenas! todo bien?';

  // Info extra del negocio
  const infoExtra = config.botExtraInfo ? `\n\n=== INFO ADICIONAL DEL NEGOCIO ===\n${config.botExtraInfo}` : '';

  // Info de derivación al asesor
  const asesorInfo = config.whatsappAsesor 
    ? `\n=== DERIVACIÓN AL ASESOR ===
Cuando el cliente quiera CONFIRMAR un envío (no solo preguntar), derivalo con buena onda:
"dale! para coordinar el envío hablá con logística: wa.me/${config.whatsappAsesor} 📦"

También derivá si:
- Hay un problema/reclamo que no podés resolver
- Piden hablar con una persona
- Consultas muy específicas sobre devoluciones o garantías complejas

Siempre con buena onda, tipo: "para eso te paso con [asesor/logística/soporte]: wa.me/${config.whatsappAsesor}"
NO derives por cualquier cosa, solo cuando realmente sea necesario.`
    : '';

  // Política de devoluciones
  const devolucionesInfo = config.returnPolicy ? `- Devoluciones: ${config.returnPolicy}` : '';
  
  // Seña para reservar
  const senaInfo = config.reservationDeposit ? `- Seña para reservar: ${config.reservationDeposit}` : '- No pedimos seña para reservar';

  // Redes sociales
  const instagramInfo = config.instagram ? `- Instagram: @${config.instagram.replace('@', '')}` : '';
  const websiteInfo = config.website ? `- Web: ${config.website}` : '';

  return `Sos vendedor de ${config.name}. ${estiloBase}

=== REGLA DE ORO ===
SOLO respondé lo que te preguntan. NO agregues información extra que no pidieron.
- Si piden lista de precios → solo la lista, sin agregar "tienen garantía" ni nada más
- Si preguntan por garantía → ahí sí explicás la garantía
- Si preguntan por envíos → ahí sí explicás sobre envíos
NO seas un bot que escupe toda la info de una. Sé natural.

=== ESTILO ===
- Minusculas siempre
- Sin puntos al final
${expresiones}
- Emojis: 🙌 pero solo cada tanto, no en todos los mensajes
- CRÍTICO: NUNCA uses saltos de línea (\n) en tus respuestas normales
- Escribí todo corrido en una sola línea, como un mensaje de WhatsApp real
- Ejemplo CORRECTO: "dale! el 11 de 128gb en amarillo está 290 U$. que dia y horario te queda bien para pasar?"
- Ejemplo INCORRECTO: "dale! el 11 está 290 U$\n\nque dia te queda bien?" ❌
${tonoExtra}
- Si el nombre se puede abreviar de forma natural, usá el apodo (ej: Lautaro→lauti, Agustín→agus). Si no queda bien abreviado (ej: José, Ana), dejalo como está.

=== CUANDO PIDEN LISTA DE PRECIOS ===
IMPORTANTE: Mandá la lista COMPLETA en un solo bloque, NO separes cada producto.

Formato (todo junto, separado solo por saltos de línea simples):
"buenas [nombre], como estas? dale te paso la lista

* 12 64gb 100🔋(colores blue/red) - 200 U$
* 12 128gb 100🔋(colores white/black/green) - 250 U$
* 13 128gb 100🔋(colores blue/pink/white/red/black/green) - 320 U$
* 13 Pro 128gb 100🔋(colores graphite/silver) - 385 U$
[...TODOS LOS PRODUCTOS...]

cualquier cosa avisame"

NO uses doble salto de línea (\n\n) entre productos. Solo salto simple (\n).

=== INFO DEL NEGOCIO (solo si preguntan) ===
- Garantía: ${config.botWarrantyDays} días
- Pago: ${pagos}
${enviosInfo}
${devolucionesInfo}
${senaInfo}
${instagramInfo}
${websiteInfo}
- Equipos: usados/seminuevos, originales, sin icloud, liberados
${config.botWorkingHours ? `- Horario: ${config.botWorkingHours}` : ''}
${infoExtra}
${asesorInfo}

=== TURNOS ===
IMPORTANTE: Antes de agendar un turno, SIEMPRE fijate en el contexto si el cliente YA TIENE UN TURNO AGENDADO.
- Si ya tiene turno → NO agendes otro, preguntale si quiere modificarlo o cancelarlo
- Si pide turno de nuevo → recordale que ya tiene uno agendado y preguntá si quiere cambiarlo

Cuando quieran comprar/pasar (y NO tengan turno):
1. Preguntá "que dia y horario te queda bien?"
2. Preguntá "y como lo abonas? ${pagos}?"
3. Confirmá y generá el tag

Ya tenés el nombre y teléfono del cliente (de WhatsApp), no los pidas.

Tag: [ACCION:AGENDAR_TURNO|nombre=X|telefono=X|fecha=YYYY-MM-DD|hora=HH:MM|sucursal=X|producto=X|pago=X]

Formas de pago para el tag:
- efectivo_ars, efectivo_usd, transferencia_ars, usdt_binance

=== MEMORIA Y CONTEXTO ===
- Recordá TODO lo que hablaste con el cliente en esta conversación
- Si ya le agendaste turno, NO le agendes otro
- Si ya le pasaste la lista de precios, no la repitas a menos que la pida de nuevo
- Si ya respondiste algo, no lo repitas
- Actuá como un humano que recuerda toda la conversación

=== EJEMPLOS ===

Cliente: buenas
Vos: ${saludoEjemplo}

Cliente: lista de precios
Vos: buenas lauti, como estas? dale te paso la lista
* 12 64gb 100🔋(colores blue/red) - 200 U$
* 13 128gb 100🔋(colores blue/pink/white) - 320 U$
* 15 Pro 256gb 100🔋(colores black/blue/natural) - 600 U$
cualquier cosa avisame

Cliente: tienen garantia?
Vos: si, todos tienen ${config.botWarrantyDays} dias de garantia

Cliente: hacen envios?
Vos: ${config.botShipsOrders ? 'si, hacemos envios' : `no, solo retiro en ${config.botLocation || 'sucursal'}`}

Cliente: quiero el 11 amarillo
Vos: dale! el 11 de 128gb en amarillo está 290 U$. que dia y horario te queda bien para pasar?

Cliente: mañana 5pm
Vos: joya, y como lo abonas?

Cliente: efectivo usd
Vos: listo, te agendo para mañana a las 17hs 🙌
[ACCION:AGENDAR_TURNO|...]

Sé natural, como un vendedor real. TODO en una línea, sin saltos.`;
}

// Cache de conversaciones - 4 horas de memoria
const conversationCache = new Map<string, { messages: Array<{role: string, content: string}>, lastUpdate: number }>();
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 horas

// Cache de nombres de contactos (phone -> nombre)
const contactNamesCache = new Map<string, string>();

class ChatbotService {
  private client: Anthropic | null = null;
  private isEnabled: boolean = true;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      console.log('🤖 Chatbot inicializado con Anthropic');
      
      // Limpiar turnos viejos cada hora
      setInterval(() => this.cleanOldAppointments(), 60 * 60 * 1000);
      // Limpiar al iniciar también
      this.cleanOldAppointments();
    } else {
      console.log('⚠️ ANTHROPIC_API_KEY no configurada, chatbot deshabilitado');
    }
  }

  async handleIncomingMessage(
    jid: string, 
    messageText: string, 
    pushName?: string, 
    realPhoneNumber?: string
  ): Promise<string | null> {
    if (!this.client || !this.isEnabled) return null;

    try {
      // Usar el número real si está disponible, sino extraer del JID
      const phoneNumber = realPhoneNumber || jid;
      const contactName = pushName || '';
      
      console.log(`[MSG] Mensaje de ${contactName || 'Sin nombre'} (${phoneNumber}): ${messageText}`);
      const cleanPhone = phoneNumber.replace(/@s\.whatsapp\.net|@lid|@g\.us|@c\.us/g, '').replace(/\D/g, '');
      
      // Guardar el nombre del contacto si lo tenemos
      if (contactName && cleanPhone) {
        this.saveContactName(cleanPhone, contactName);
      }

      // Obtener conversación para tener contexto
      const conversation = this.getConversation(cleanPhone);
      
      // Determinar delay según si es primera interacción o conversación continua
      const isFirstMessage = conversation.messages.length === 0;
      const delay = isFirstMessage ? 10000 : 4000; // 10s primera vez, 4s después
      
      // Obtener contexto de mensajes anteriores para detectar de qué producto hablan
      const recentContext = conversation.messages.slice(-6).map(m => m.content).join(' ');

      // Verificar si piden fotos PRIMERO (con contexto de conversación)
      const photoRequest = await this.checkPhotoRequest(messageText, phoneNumber, recentContext);
      
      // Si se enviaron fotos, responder directamente sin IA
      if (photoRequest.sent) {
        const response = photoRequest.textResponse || 'ahi te mando las fotos';
        await this.logMessage(cleanPhone, messageText, response);
        console.log(`📸 Respuesta (fotos enviadas): ${response}`);
        return response;
      }
      conversation.messages.push({ role: 'user', content: messageText });

      // Obtener contexto completo (incluye info de fotos disponibles y config del tenant)
      const { context: systemContext, tenantConfig } = await this.getFullSystemContext(cleanPhone, messageText);

      // Generar respuesta con la configuración del tenant
      let response = await this.generateResponse(conversation.messages, systemContext, tenantConfig);

      // Procesar acciones si las hay (retorna true si procesó un turno)
      const { cleanResponse, appointmentCreated } = await this.processActions(response, cleanPhone);
      response = cleanResponse;

      // Detección automática de turnos SOLO si la IA no generó el tag
      if (!appointmentCreated) {
        await this.autoDetectAndCreateAppointment(response, cleanPhone, conversation.messages);
      }

      // Guardar en historial
      conversation.messages.push({ role: 'assistant', content: response });
      conversation.lastUpdate = Date.now();
      if (conversation.messages.length > 50) {
        conversation.messages = conversation.messages.slice(-50);
      }
      conversationCache.set(cleanPhone, conversation);

      // Log en DB
      await this.logMessage(cleanPhone, messageText, response);

      console.log(`🤖 Respuesta: ${response}`);
      
      // Delay para simular que está escribiendo (más humano)
      console.log(`⏳ Esperando ${delay/1000}s antes de responder...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return response;
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      return null;
    }
  }

  // Verificar si el mensaje pide fotos y enviarlas
  private async checkPhotoRequest(message: string, jid: string, conversationContext: string = ''): Promise<{ sent: boolean; textResponse?: string }> {
    const msgLower = message.toLowerCase();
    // Combinar mensaje actual con contexto de conversación para detectar el producto
    const fullContext = (conversationContext + ' ' + message).toLowerCase();
    
    // Detectar si piden foto/imagen
    const photoKeywords = ['foto', 'fotos', 'imagen', 'imagenes', 'imágenes', 'mostrame', 'pasame foto', 'tenes foto', 'tienen foto', 'manda foto', 'mandame foto', 'como es', 'como son'];
    const wantsPhoto = photoKeywords.some(kw => msgLower.includes(kw));
    
    if (!wantsPhoto) return { sent: false };

    try {
      // Obtener el tenant actual para filtrar fotos
      const tenantData = await getTenantByWhatsAppNumber();
      const tenantId = tenantData?.id;

      // Buscar en todas las fotos disponibles para hacer match
      const availableModels = await prisma.productPhoto.findMany({
        where: { 
          active: true,
          ...(tenantId ? { tenantId } : {})
        },
        select: { modelName: true },
        distinct: ['modelName']
      });

      // Buscar qué modelo mencionan (en mensaje actual o contexto reciente)
      let matchedModel = '';
      
      for (const photo of availableModels) {
        const modelLower = photo.modelName.toLowerCase();
        const modelWords = modelLower.split(' ').filter(w => w.length >= 3);
        
        // Primero buscar en el mensaje actual
        let foundInMessage = modelWords.some(word => msgLower.includes(word));
        
        // Si no está en el mensaje, buscar en el contexto de conversación
        if (!foundInMessage && conversationContext) {
          foundInMessage = modelWords.some(word => fullContext.includes(word));
        }
        
        if (foundInMessage) {
          matchedModel = photo.modelName;
          console.log(`📸 Modelo detectado: ${matchedModel}`);
          break;
        }
      }

      // Si no encontró match directo, intentar con patrones conocidos (en mensaje o contexto)
      if (!matchedModel) {
        const modelPatterns = [
          { pattern: /iphone\s*(\d+)\s*(pro\s*max|pro|plus)?/i, builder: (m: RegExpMatchArray) => {
            const num = m[1];
            const variant = m[2] ? ' ' + m[2].replace(/\s+/g, ' ').trim() : '';
            return `iPhone ${num}${variant}`;
          }},
          { pattern: /airpods?\s*(pro\s*2?|max|3|2)?/i, builder: (m: RegExpMatchArray) => {
            return 'AirPods' + (m[1] ? ' ' + m[1] : '');
          }},
          { pattern: /(16|15|14|13|12|11)\s*(pro\s*max|pro|plus)?/i, builder: (m: RegExpMatchArray) => {
            const variant = m[2] ? ' ' + m[2].replace(/\s+/g, ' ').trim() : '';
            return `iPhone ${m[1]}${variant}`;
          }},
          { pattern: /magsafe/i, builder: () => 'MagSafe' },
          { pattern: /bater[ií]a/i, builder: () => 'MagSafe' }, // Batería portátil = MagSafe
          { pattern: /cargador/i, builder: () => 'Cargador' },
          { pattern: /funda/i, builder: () => 'Funda' },
          { pattern: /apple\s*watch/i, builder: () => 'Apple Watch' },
        ];

        // Buscar primero en mensaje actual, luego en contexto
        for (const { pattern, builder } of modelPatterns) {
          let match = msgLower.match(pattern);
          if (!match && fullContext) {
            match = fullContext.match(pattern);
          }
          if (match) {
            matchedModel = builder(match);
            console.log(`📸 Modelo detectado por patrón: ${matchedModel}`);
            break;
          }
        }
      }

      if (!matchedModel) {
        return { sent: false };
      }

      // Buscar fotos de ese modelo (búsqueda flexible)
      const modelPhotos = await prisma.productPhoto.findMany({
        where: {
          modelName: { contains: matchedModel },
          active: true,
          ...(tenantId ? { tenantId } : {})
        },
        orderBy: { order: 'asc' }
      });

      if (modelPhotos.length === 0) {
        return { sent: false };
      }

      // Seleccionar máximo 2 fotos aleatorias para variar
      let photosToSend = modelPhotos;
      if (modelPhotos.length > 2) {
        // Mezclar y tomar 2 aleatorias
        const shuffled = [...modelPhotos].sort(() => Math.random() - 0.5);
        photosToSend = shuffled.slice(0, 2);
      }

      // Enviar las fotos (máximo 2)
      const imagePaths = photosToSend.map(p => p.url);
      const caption = `${photosToSend[0].modelName}`;
      
      await whatsappService.sendImages(jid, imagePaths, caption);
      
      console.log(`📸 Enviadas ${photosToSend.length} fotos de ${matchedModel} a ${jid}`);
      
      // Respuestas variadas y naturales después de enviar fotos
      const responses = [
        'ahi tenes, estan impecables. cualquier cosa avisame',
        'ahi van, fijate que estan joya. decime si te interesa',
        'listo, ahi tenes las fotos. avisame cualquier cosa',
        'ahi estan, cualquier duda chiflame'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return { 
        sent: true, 
        textResponse: randomResponse
      };
    } catch (error) {
      console.error('Error enviando fotos:', error);
      return { sent: false };
    }
  }

  private async processActions(response: string, customerPhone: string): Promise<{ cleanResponse: string; appointmentCreated: boolean }> {
    // Buscar acciones en la respuesta
    const actionRegex = /\[ACCION:(\w+)\|([^\]]+)\]/g;
    let match;
    let cleanResponse = response;
    let appointmentCreated = false;

    while ((match = actionRegex.exec(response)) !== null) {
      const actionType = match[1];
      const paramsStr = match[2];
      const params: Record<string, string> = {};
      
      paramsStr.split('|').forEach(p => {
        const [key, value] = p.split('=');
        if (key && value) params[key.trim()] = value.trim();
      });

      console.log(`🔧 Ejecutando acción: ${actionType}`, params);

      try {
        switch (actionType) {
          case 'RESERVAR_PRODUCTO':
            await this.reservarProducto(params, customerPhone);
            break;
          case 'CANCELAR_RESERVA':
            await this.cancelarReserva(params, customerPhone);
            break;
          case 'AGENDAR_TURNO':
            const turnoResult = await this.agendarTurno(params, customerPhone);
            console.log(`📅 Resultado agendar turno:`, turnoResult);
            if (turnoResult.message === 'PEDIR_TELEFONO') {
              // No se pudo crear el turno porque falta el teléfono
              // Reemplazar la respuesta para que pida el número
              cleanResponse = 'che me pasas tu numero de telefono asi te agendo bien el turno?';
              appointmentCreated = false;
            } else {
              appointmentCreated = turnoResult.success;
            }
            break;
          case 'CANCELAR_TURNO':
            await this.cancelarTurno(params.telefono || customerPhone);
            break;
          case 'MODIFICAR_TURNO':
            await this.modificarTurno(params, customerPhone);
            break;
          case 'BUSCAR_VENTA':
          case 'CONSULTAR_GARANTIA':
            console.log(`📋 Acción informativa: ${actionType}`);
            break;
        }
      } catch (error) {
        console.error(`Error ejecutando acción ${actionType}:`, error);
      }

      // Remover la acción del mensaje visible
      cleanResponse = cleanResponse.replace(match[0], '').trim();
    }

    // Limpiar la respuesta - mantener saltos de línea simples, quitar excesivos
    cleanResponse = cleanResponse
      .replace(/\n\n\n+/g, '\n\n')      // Múltiples saltos -> máximo dos
      .replace(/  +/g, ' ')             // Múltiples espacios -> uno solo
      .trim();

    return { cleanResponse, appointmentCreated };
  }

  private async reservarProducto(params: Record<string, string>, customerPhone: string) {
    const { modelo, color } = params;
    
    console.log(`🔍 Buscando producto para reservar: modelo="${modelo}", color="${color}"`);
    
    // Obtener el tenant actual
    const tenantData = await getTenantByWhatsAppNumber();
    const tenantId = tenantData?.id;
    
    // Extraer partes del modelo para búsqueda flexible
    // Ej: "iPhone 11 128gb" -> buscar por "iPhone 11" y storage "128"
    const modelParts = (modelo || '').toLowerCase();
    const storageMatch = modelParts.match(/(\d+)\s*gb/i);
    const storage = storageMatch ? storageMatch[1] : null;
    
    // Limpiar modelo quitando el storage
    const cleanModel = modelParts.replace(/\d+\s*gb/i, '').trim();
    
    console.log(`🔍 Búsqueda flexible: cleanModel="${cleanModel}", storage="${storage}", color="${color}"`);
    
    // Buscar el producto con búsqueda flexible
    const product = await prisma.product.findFirst({
      where: {
        active: true,
        stock: { gt: 0 },
        reserved: { equals: 0 },
        OR: [
          { model: { contains: cleanModel } },
          { name: { contains: cleanModel } },
          { model: { contains: modelo || '' } },
          { name: { contains: modelo || '' } }
        ],
        ...(storage ? { storage: { contains: storage } } : {}),
        ...(color ? { color: { contains: color } } : {}),
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: { reserved: 1 }
      });
      console.log(`✅ Producto reservado: ${product.model} ${product.storage || ''} ${product.color} (ID: ${product.id})`);
    } else {
      // Intentar sin filtro de color
      const productWithoutColor = await prisma.product.findFirst({
        where: {
          active: true,
          stock: { gt: 0 },
          reserved: { equals: 0 },
          OR: [
            { model: { contains: cleanModel } },
            { name: { contains: cleanModel } }
          ],
          ...(storage ? { storage: { contains: storage } } : {}),
          ...(tenantId ? { tenantId } : {})
        }
      });
      
      if (productWithoutColor) {
        await prisma.product.update({
          where: { id: productWithoutColor.id },
          data: { reserved: 1 }
        });
        console.log(`✅ Producto reservado (sin filtro color): ${productWithoutColor.model} ${productWithoutColor.storage || ''} ${productWithoutColor.color} (ID: ${productWithoutColor.id})`);
      } else {
        console.log(`⚠️ No se encontró producto para reservar con modelo="${modelo}"`);
      }
    }
  }

  private async cancelarReserva(params: Record<string, string>, customerPhone: string) {
    const { modelo } = params;
    
    console.log(`🔍 Buscando producto para cancelar reserva: modelo="${modelo}"`);
    
    // Obtener el tenant actual
    const tenantData = await getTenantByWhatsAppNumber();
    const tenantId = tenantData?.id;
    
    // Extraer partes del modelo para búsqueda flexible
    const modelParts = (modelo || '').toLowerCase();
    const storageMatch = modelParts.match(/(\d+)\s*gb/i);
    const storage = storageMatch ? storageMatch[1] : null;
    const cleanModel = modelParts.replace(/\d+\s*gb/i, '').trim();
    
    // Buscar producto reservado que coincida
    const product = await prisma.product.findFirst({
      where: {
        active: true,
        reserved: { gt: 0 },
        OR: [
          { model: { contains: cleanModel } },
          { name: { contains: cleanModel } },
          { model: { contains: modelo || '' } },
          { name: { contains: modelo || '' } }
        ],
        ...(storage ? { storage: { contains: storage } } : {}),
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: { reserved: 0 }
      });
      console.log(`✅ Reserva cancelada: ${product.model} ${product.storage || ''} ${product.color} (ID: ${product.id})`);
    } else {
      // Intentar buscar cualquier producto reservado con ese modelo
      const anyReserved = await prisma.product.findFirst({
        where: {
          active: true,
          reserved: { gt: 0 },
          OR: [
            { model: { contains: cleanModel } },
            { name: { contains: cleanModel } }
          ],
          ...(tenantId ? { tenantId } : {})
        }
      });
      
      if (anyReserved) {
        await prisma.product.update({
          where: { id: anyReserved.id },
          data: { reserved: 0 }
        });
        console.log(`✅ Reserva cancelada (búsqueda amplia): ${anyReserved.model} ${anyReserved.storage || ''} ${anyReserved.color} (ID: ${anyReserved.id})`);
      } else {
        console.log(`⚠️ No se encontró producto reservado con modelo="${modelo}"`);
      }
    }
  }

  private async agendarTurno(params: Record<string, string>, customerPhone: string): Promise<{ success: boolean; message: string }> {
    const { nombre, fecha, hora, sucursal, producto, pago, telefono } = params;
    
    // Obtener el tenant actual
    const tenantData = await getTenantByWhatsAppNumber();
    if (!tenantData) {
      console.log('❌ No se encontró tenant para agendar turno');
      return { success: false, message: 'Error de configuración del sistema' };
    }
    const tenantId = tenantData.id;
    
    // Obtener nombre del cliente - primero del cache de WhatsApp, luego del parámetro
    const finalNombre = this.getContactName(customerPhone) || nombre || 'Cliente WhatsApp';
    
    // Función para validar número de teléfono argentino
    const isValidArgPhone = (phone: string): boolean => {
      if (!phone) return false;
      // Si empieza con LID_, no es válido
      if (phone.startsWith('LID_')) return false;
      const clean = phone.replace(/\D/g, '');
      // Debe tener entre 10 y 13 dígitos
      if (clean.length < 10 || clean.length > 13) return false;
      // No puede ser un LID (más de 15 dígitos o patrones raros)
      if (clean.length > 13) return false;
      // Patrones válidos argentinos
      return clean.match(/^549\d{10}$/) !== null ||  // 549 + 10 dígitos
             clean.match(/^54\d{10,11}$/) !== null || // 54 + 10-11 dígitos
             clean.match(/^11\d{8}$/) !== null ||     // 11 + 8 dígitos (Buenos Aires)
             clean.match(/^\d{10}$/) !== null;        // 10 dígitos sin código
    };
    
    // Función para normalizar número argentino
    const normalizeArgPhone = (phone: string): string => {
      let clean = phone.replace(/\D/g, '');
      // Quitar 15 del inicio si está
      if (clean.startsWith('15')) clean = clean.substring(2);
      // Si tiene 10 dígitos, agregar 549
      if (clean.length === 10) return '549' + clean;
      // Si empieza con 54 pero no 549, insertar el 9
      if (clean.startsWith('54') && !clean.startsWith('549') && clean.length === 12) {
        return '549' + clean.substring(2);
      }
      // Si ya tiene formato correcto
      if (clean.startsWith('549') && clean.length === 13) return clean;
      // Fallback
      return clean;
    };
    
    // PRIORIDAD: Usar el teléfono del parámetro (que el cliente dio en la conversación)
    let finalPhone = '';
    
    // 1. Primero intentar con el teléfono que pasó el cliente en la conversación
    if (telefono && isValidArgPhone(telefono)) {
      finalPhone = normalizeArgPhone(telefono);
      console.log(`📱 Usando teléfono de la conversación: ${telefono} -> ${finalPhone}`);
    }
    // 2. Si no hay teléfono válido del cliente, intentar con customerPhone (del WhatsApp)
    else if (isValidArgPhone(customerPhone)) {
      finalPhone = normalizeArgPhone(customerPhone);
      console.log(`📱 Usando teléfono de WhatsApp: ${customerPhone} -> ${finalPhone}`);
    }
    
    // 3. Si no tenemos un número válido, RECHAZAR y pedir que pregunte el número
    if (!finalPhone || !isValidArgPhone(finalPhone)) {
      console.log(`❌ No hay teléfono válido. telefono="${telefono}", customerPhone="${customerPhone}"`);
      return { 
        success: false, 
        message: 'PEDIR_TELEFONO' // Señal especial para que el bot pida el número
      };
    }
    
    console.log(`📅 Intentando agendar turno:`, { nombre, telefono: finalPhone, fecha, hora, sucursal, producto, pago });
    
    // Buscar sucursal - FILTRADO POR TENANT
    let store = await prisma.store.findFirst({
      where: { 
        active: true,
        tenantId,
        name: { contains: sucursal || '' }
      }
    });
    
    if (!store) {
      console.log(`⚠️ Sucursal "${sucursal}" no encontrada, buscando cualquier sucursal activa...`);
      store = await prisma.store.findFirst({ where: { active: true, tenantId } });
    }

    if (!store) {
      console.log(`❌ No hay sucursales disponibles`);
      return { success: false, message: 'No hay sucursales disponibles' };
    }
    
    console.log(`✅ Sucursal encontrada: ${store.name}`);

    // === PARSEAR FECHA ===
    let appointmentDate: Date;
    const now = new Date();
    
    if (!fecha || fecha.toLowerCase() === 'hoy') {
      appointmentDate = new Date(now);
    } else if (fecha.toLowerCase() === 'mañana' || fecha.toLowerCase() === 'manana') {
      appointmentDate = new Date(now);
      appointmentDate.setDate(appointmentDate.getDate() + 1);
    } else {
      // Intentar parsear la fecha
      appointmentDate = new Date(fecha);
      // Si la fecha es inválida, usar hoy
      if (isNaN(appointmentDate.getTime())) {
        console.log(`⚠️ Fecha inválida "${fecha}", usando hoy`);
        appointmentDate = new Date(now);
      }
    }
    
    // Asegurar que la fecha sea solo la fecha (sin hora)
    appointmentDate.setHours(0, 0, 0, 0);
    
    // === PARSEAR HORA ===
    let parsedHora = hora || '10:00';
    
    // Limpiar la hora de texto extra (hs, hrs, pm, am, etc.)
    parsedHora = parsedHora.toLowerCase().replace(/\s+/g, '');
    
    // Si tiene formato HH:MM, extraerlo
    const timeMatch = parsedHora.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      let h = parseInt(timeMatch[1]);
      const m = parseInt(timeMatch[2]);
      // Si dice "pm" y la hora es menor a 12, sumar 12
      if (parsedHora.includes('pm') && h < 12) h += 12;
      parsedHora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else {
      // Si no tiene ":", extraer solo el número
      const numMatch = parsedHora.match(/(\d{1,2})/);
      if (numMatch) {
        let h = parseInt(numMatch[1]);
        // Si dice "pm" y la hora es menor a 12, sumar 12
        if (parsedHora.includes('pm') && h < 12) h += 12;
        // Si es menor a 8 y no dice "am", probablemente es PM (ej: "4" = 16:00)
        else if (h > 0 && h < 8 && !parsedHora.includes('am')) h += 12;
        // Validar que la hora sea válida (0-23)
        if (h > 23) h = h % 24;
        parsedHora = `${String(h).padStart(2, '0')}:00`;
      }
    }
    
    console.log(`📆 Fecha parseada: ${appointmentDate.toISOString().split('T')[0]}, Hora: ${parsedHora}`);
    const dayOfWeek = appointmentDate.getDay();
    
    console.log(`📆 Fecha: ${fecha} -> ${appointmentDate.toISOString()}, día de semana: ${dayOfWeek}`);
    
    // === VALIDACIÓN DE HORARIOS PASADOS ===
    const requestedTime = parsedHora;
    const [reqH, reqM] = requestedTime.split(':').map(Number);
    
    // Crear fecha/hora completa del turno solicitado
    const appointmentDateTime = new Date(appointmentDate);
    appointmentDateTime.setHours(reqH, reqM, 0, 0);
    
    // Si la fecha/hora ya pasó, rechazar
    if (appointmentDateTime < now) {
      const isToday = appointmentDate.toDateString() === now.toDateString();
      if (isToday) {
        console.log(`❌ Hora ya pasó: ${requestedTime}, hora actual: ${now.getHours()}:${now.getMinutes()}`);
        return { success: false, message: `uh esa hora ya paso, son las ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}. decime otro horario` };
      } else {
        console.log(`❌ Fecha ya pasó: ${fecha}`);
        return { success: false, message: `esa fecha ya paso, decime otra fecha` };
      }
    }
    
    // Obtener horario del día
    const dayHoursMap: Record<number, string | null> = {
      0: store.sundayHours,
      1: store.mondayHours,
      2: store.tuesdayHours,
      3: store.wednesdayHours,
      4: store.thursdayHours,
      5: store.fridayHours,
      6: store.saturdayHours,
    };
    
    const dayHours = dayHoursMap[dayOfWeek];
    console.log(`🕐 Horario del día ${dayOfWeek}: ${dayHours || 'CERRADO'}`);
    
    // Si no hay horario configurado para ese día, usar horario por defecto 09:00-19:00
    if (!dayHours) {
      console.log(`⚠️ No hay horario configurado para el día ${dayOfWeek}, usando horario por defecto 09:00-19:00`);
    }
    
    const effectiveHours = dayHours || '09:00-19:00';

    // Validar que la hora esté dentro del horario
    const [openTime, closeTime] = effectiveHours.split('-');
    
    console.log(`🕐 Hora solicitada: ${requestedTime}, horario: ${openTime}-${closeTime}`);
    
    if (requestedTime < openTime || requestedTime >= closeTime) {
      console.log(`❌ Hora fuera de horario`);
      return { success: false, message: `El horario de la sucursal es de ${openTime} a ${closeTime}` };
    }

    // Redondear a slots de 15 minutos
    const duration = store.appointmentDuration || 15;
    const [h, m] = requestedTime.split(':').map(Number);
    const roundedMinutes = Math.round(m / duration) * duration;
    const finalTime = `${String(h).padStart(2, '0')}:${String(roundedMinutes % 60).padStart(2, '0')}`;
    
    console.log(`🕐 Hora final (redondeada): ${finalTime}`);

    // Verificar si el slot está ocupado
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        storeId: store.id,
        date: appointmentDate,
        time: finalTime,
        status: { not: 'CANCELLED' }
      }
    });

    if (existingAppointment) {
      console.log(`⚠️ Slot ocupado, buscando alternativas...`);
      // Buscar slots cercanos disponibles
      const availableSlots = await this.getAvailableSlots(store.id, appointmentDate, effectiveHours, duration);
      const nearbySlots = availableSlots.filter(s => {
        const diff = Math.abs(this.timeToMinutes(s) - this.timeToMinutes(finalTime));
        return diff <= 60; // Dentro de 1 hora
      }).slice(0, 3);
      
      return { 
        success: false, 
        message: `Ese horario está ocupado. Horarios cercanos disponibles: ${nearbySlots.join(', ')}` 
      };
    }

    // Mapear forma de pago a los nuevos valores
    const paymentMap: Record<string, string> = {
        'efectivo_ars': 'CASH_ARS',
        'efectivo_usd': 'CASH_USD',
        'transferencia_ars': 'TRANSFER_ARS',
        'usdt_binance': 'USDT_BINANCE',
        // Variantes de USDT
        'usdt': 'USDT_BINANCE',
        'cripto': 'USDT_BINANCE',
        'crypto': 'USDT_BINANCE',
        'binance': 'USDT_BINANCE',
        // Compatibilidad con valores viejos
        'efectivo': 'CASH_ARS',
        'transferencia': 'TRANSFER_ARS',
        'tarjeta': 'CARD',
        'cash': 'CASH_ARS',
        'transfer': 'TRANSFER_ARS',
        'card': 'CARD',
        // Variantes en español
        'dolares': 'CASH_USD',
        'dólares': 'CASH_USD',
        'usd': 'CASH_USD',
        'pesos': 'CASH_ARS',
        'ars': 'CASH_ARS',
      };
      const paymentMethod = pago ? paymentMap[pago.toLowerCase()] || pago.toUpperCase() : null;

      // Intentar reservar producto si hay uno (pero crear turno igual si no se puede)
      let productId: string | null = null;
      if (producto) {
        // Intentar reservar el producto
        const reservedProduct = await this.reservarProductoParaTurno(producto, tenantId);
        if (reservedProduct) {
          productId = reservedProduct.id;
          console.log(`📦 Producto reservado: ${reservedProduct.model}`);
        } else {
          console.log(`⚠️ No se pudo reservar "${producto}", turno se crea sin reserva de producto`);
        }
      }

      // === DETECCIÓN AUTOMÁTICA MAYORISTA/MINORISTA ===
      // Si el producto tiene "x3" o más unidades, es mayorista
      let customerType: 'MAYORISTA' | 'MINORISTA' = 'MINORISTA';
      if (producto) {
        const quantityMatch = producto.match(/x(\d+)/i);
        if (quantityMatch) {
          const quantity = parseInt(quantityMatch[1]);
          if (quantity >= 3) {
            customerType = 'MAYORISTA';
            console.log(`📦 Detectado MAYORISTA: ${quantity} unidades`);
          }
        }
      }

      console.log(`📝 Creando turno (tag) con datos:`, {
        customerName: finalNombre,
        customerPhone: finalPhone,
        date: appointmentDate.toISOString(),
        time: finalTime,
        product: producto || null,
        productId: productId,
        paymentMethod: paymentMethod,
        customerType: customerType,
        tenantId: tenantId,
        storeId: store.id
      });
      
      try {
        const newAppointment = await prisma.appointment.create({
          data: {
            customerName: finalNombre,
            customerPhone: finalPhone,
            date: appointmentDate,
            time: finalTime,
            product: producto || null,
            productId: productId,
            paymentMethod: paymentMethod,
            customerType: customerType,
            status: 'CONFIRMED',
            source: 'WHATSAPP',
            tenantId: tenantId,
            storeId: store.id
          }
        });
        console.log(`✅ Turno agendado ID: ${newAppointment.id} - ${finalNombre} - ${fecha} ${finalTime} en ${store.name} - Producto: ${producto || 'N/A'} - Pago: ${paymentMethod}`);
        return { success: true, message: `Turno confirmado para ${finalTime} en ${store.name}` };
      } catch (createError) {
        console.error(`❌ Error creando turno en DB:`, createError);
        // Liberar producto si se reservó
        if (productId) {
          await prisma.product.update({
            where: { id: productId },
            data: { reserved: 0 }
          });
        }
        return { success: false, message: 'Error al guardar el turno en la base de datos' };
      }

    return { success: false, message: 'Error al crear el turno' };
  }

  private async getAvailableSlots(storeId: string, date: Date, dayHours: string, duration: number): Promise<string[]> {
    const [openTime, closeTime] = dayHours.split('-');
    const slots: string[] = [];
    
    let currentMinutes = this.timeToMinutes(openTime);
    const endMinutes = this.timeToMinutes(closeTime) - duration;
    
    while (currentMinutes <= endMinutes) {
      const time = this.minutesToTime(currentMinutes);
      slots.push(time);
      currentMinutes += duration;
    }

    // Obtener turnos ocupados
    const occupiedAppointments = await prisma.appointment.findMany({
      where: {
        storeId,
        date,
        status: { not: 'CANCELLED' }
      },
      select: { time: true }
    });

    const occupiedTimes = occupiedAppointments.map(a => a.time);
    return slots.filter(s => !occupiedTimes.includes(s));
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private async cancelarTurno(telefono: string) {
    // Obtener el tenant actual
    const tenantData = await getTenantByWhatsAppNumber();
    const tenantId = tenantData?.id;
    
    const appointment = await prisma.appointment.findFirst({
      where: {
        customerPhone: { contains: telefono.slice(-8) },
        status: { not: 'CANCELLED' },
        date: { gte: new Date() },
        ...(tenantId ? { tenantId } : {})
      },
      orderBy: { date: 'asc' }
    });

    if (appointment) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CANCELLED' }
      });
      console.log(`✅ Turno cancelado: ${appointment.customerName}`);
    }
  }

  private async modificarTurno(params: Record<string, string>, customerPhone: string) {
    const { telefono, nueva_fecha, nueva_hora } = params;
    
    // Obtener el tenant actual
    const tenantData = await getTenantByWhatsAppNumber();
    const tenantId = tenantData?.id;
    
    const appointment = await prisma.appointment.findFirst({
      where: {
        customerPhone: { contains: (telefono || customerPhone).slice(-8) },
        status: { not: 'CANCELLED' },
        date: { gte: new Date() },
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (appointment) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          ...(nueva_fecha ? { date: new Date(nueva_fecha) } : {}),
          ...(nueva_hora ? { time: nueva_hora } : {})
        }
      });
      console.log(`✅ Turno modificado: ${nueva_fecha} ${nueva_hora}`);
    }
  }

  private async cleanOldAppointments() {
    try {
      // Borrar TODOS los turnos de días pasados (antes de hoy a las 00:00)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Primero obtener los turnos viejos con productos reservados
      const oldAppointments = await prisma.appointment.findMany({
        where: {
          date: { lt: today }
        },
        select: { id: true, productId: true }
      });

      // Liberar los productos reservados de esos turnos
      const productIds = oldAppointments
        .filter(a => a.productId)
        .map(a => a.productId as string);
      
      if (productIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { reserved: 0 }
        });
        console.log(`📦 Liberados ${productIds.length} productos de turnos viejos`);
      }

      // Ahora borrar los turnos
      const deleted = await prisma.appointment.deleteMany({
        where: {
          date: { lt: today }
        }
      });

      if (deleted.count > 0) {
        console.log(`🧹 Limpiados ${deleted.count} turnos de días pasados`);
      }
    } catch (error) {
      console.error('Error limpiando turnos:', error);
    }
  }

  // Detección automática de turnos cuando la IA no genera el tag
  private async autoDetectAndCreateAppointment(
    response: string, 
    customerPhone: string, 
    conversationHistory: Array<{role: string, content: string}>
  ) {
    // Si ya tiene el tag de acción, no hacer nada
    if (response.includes('[ACCION:AGENDAR_TURNO')) return;

    // Detectar si la respuesta confirma un turno
    const confirmPhrases = ['te agendo', 'te anoto', 'agendado', 'confirmado', 'te espero', 'nos vemos'];
    const responseLower = response.toLowerCase();
    const hasConfirmation = confirmPhrases.some(phrase => responseLower.includes(phrase));
    
    console.log(`🔍 Auto-detect: respuesta="${response.substring(0, 100)}...", hasConfirmation=${hasConfirmation}`);
    
    if (!hasConfirmation) {
      console.log('⏭️ No se detectó confirmación de turno en la respuesta');
      return;
    }

    console.log('🔍 Detectada confirmación de turno sin tag, intentando agendar automáticamente...');

    try {
      // Extraer datos del contexto de conversación
      const fullContext = conversationHistory.map(m => m.content).join(' ').toLowerCase();
      const responseText = response.toLowerCase();

      // Extraer hora - buscar patrones como "15hs", "15:00", "a las 15", "15 hs"
      const horaMatch = responseText.match(/(?:a las\s+)?(\d{1,2})(?:\s*(?:hs|hrs|h|:00|:30))?/i) || 
                        fullContext.match(/(?:a las\s+)?(\d{1,2})(?:\s*(?:hs|hrs|h|:00|:30))?/i);
      const hora = horaMatch ? `${horaMatch[1].padStart(2, '0')}:00` : null;
      console.log(`🕐 Hora extraída: ${hora} (match: ${horaMatch?.[0]})`);
      

      // Extraer fecha (mañana, lunes, martes, etc.)
      let fecha = new Date();
      
      // PRIMERO detectar día de la semana (tiene prioridad)
      if (responseText.includes('mañana') || fullContext.includes('mañana')) {
        fecha.setDate(fecha.getDate() + 1);
        console.log(`📅 Detectado: mañana`);
      } else if (responseText.includes('lunes') || fullContext.includes('lunes')) {
        fecha = this.getNextDayOfWeek(1);
        console.log(`📅 Detectado: lunes`);
      } else if (responseText.includes('martes') || fullContext.includes('martes')) {
        fecha = this.getNextDayOfWeek(2);
        console.log(`📅 Detectado: martes`);
      } else if (responseText.includes('miercoles') || responseText.includes('miércoles') || fullContext.includes('miercoles')) {
        fecha = this.getNextDayOfWeek(3);
        console.log(`📅 Detectado: miércoles`);
      } else if (responseText.includes('jueves') || fullContext.includes('jueves')) {
        fecha = this.getNextDayOfWeek(4);
        console.log(`📅 Detectado: jueves`);
      } else if (responseText.includes('viernes') || fullContext.includes('viernes')) {
        fecha = this.getNextDayOfWeek(5);
        console.log(`📅 Detectado: viernes`);
      } else if (responseText.includes('sabado') || responseText.includes('sábado') || fullContext.includes('sabado')) {
        fecha = this.getNextDayOfWeek(6);
        console.log(`📅 Detectado: sábado`);
      } else if (responseText.includes('domingo') || fullContext.includes('domingo')) {
        fecha = this.getNextDayOfWeek(0);
        console.log(`📅 Detectado: domingo`);
      } else {
        // Si no hay día de semana, buscar número de día específico
        const fechaEspecificaMatch = responseText.match(/(?:el\s+)?(\d{1,2})(?:\s*de\s*(?:diciembre|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre))?/i);
        if (fechaEspecificaMatch) {
          const dia = parseInt(fechaEspecificaMatch[1]);
          if (dia >= 1 && dia <= 31) {
            const hoy = new Date();
            if (dia < hoy.getDate()) {
              fecha = new Date(hoy.getFullYear(), hoy.getMonth() + 1, dia);
            } else {
              fecha = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
            }
            console.log(`📅 Fecha específica detectada: día ${dia}`);
          }
        }
      }
      console.log(`📅 Fecha final: ${fecha.toDateString()} (${fecha.toISOString().split('T')[0]})`);

      // Extraer sucursal
      let sucursal = '';
      if (responseText.includes('adrogue') || fullContext.includes('adrogue')) {
        sucursal = 'Adrogue';
      } else if (responseText.includes('lomas') || fullContext.includes('lomas')) {
        sucursal = 'Lomas';
      }

      // Extraer nombre del cliente - PRIMERO del cache de WhatsApp
      let nombre = this.getContactName(customerPhone) || 'Cliente WhatsApp';
      
      // Si no hay nombre en cache, buscar en la conversación
      if (nombre === 'Cliente WhatsApp') {
        const nombrePatterns = [
          /dale\s+([a-záéíóúñ]+)/i,
          /listo\s+([a-záéíóúñ]+)/i,
          /joya\s+([a-záéíóúñ]+)/i,
          /perfecto\s+([a-záéíóúñ]+)/i,
          /me\s+llamo\s+([a-záéíóúñ]+)/i,
          /soy\s+([a-záéíóúñ]+)/i,
          /nombre[:\s]+([a-záéíóúñ]+)/i
        ];
        for (const pattern of nombrePatterns) {
          const match = responseText.match(pattern) || fullContext.match(pattern);
          if (match && match[1].length > 2) {
            nombre = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
            break;
          }
        }
      }
      console.log(`👤 Nombre extraído: ${nombre}`);

      // Extraer producto - buscar patrón específico de iPhone
      let producto: string | null = null;
      const iphonePattern = /iphone\s*(\d+)\s*(pro\s*max|pro|plus)?\s*(\d+\s*gb)?\s*(blanco|negro|azul|rojo|verde|rosa|titanio)?/i;
      const iphoneMatch = fullContext.match(iphonePattern) || responseText.match(iphonePattern);
      if (iphoneMatch) {
        const num = iphoneMatch[1];
        const variant = iphoneMatch[2] ? ' ' + iphoneMatch[2].replace(/\s+/g, ' ').trim() : '';
        const storage = iphoneMatch[3] ? ' ' + iphoneMatch[3].replace(/\s+/g, '') : '';
        const color = iphoneMatch[4] ? ' ' + iphoneMatch[4] : '';
        producto = `iPhone ${num}${variant}${storage}${color}`.trim();
      }
      console.log(`📱 Producto extraído: ${producto}`);

      // Extraer forma de pago
      let pago = 'CASH_ARS';
      if (responseText.includes('usd') || responseText.includes('dolar') || fullContext.includes('usd')) {
        pago = 'CASH_USD';
      } else if (responseText.includes('transferencia') || fullContext.includes('transferencia')) {
        pago = 'TRANSFER_ARS';
      } else if (responseText.includes('usdt') || responseText.includes('binance') || fullContext.includes('usdt')) {
        pago = 'USDT_BINANCE';
      }

      // Si no hay hora, usar 10:00 por defecto
      const horaFinal = hora || '10:00';
      if (!hora) {
        console.log('⚠️ No se pudo extraer hora, usando 10:00 por defecto');
      }

      // Buscar sucursal (si no se detectó, usar la primera disponible)
      // Obtener el tenant actual
      const tenantData = await getTenantByWhatsAppNumber();
      if (!tenantData) {
        console.log('❌ No se encontró tenant para auto-agendar turno');
        return;
      }
      const tenantId = tenantData.id;

      let store;
      if (sucursal) {
        store = await prisma.store.findFirst({
          where: { active: true, tenantId, name: { contains: sucursal } }
        });
      }
      
      if (!store) {
        console.log(`⚠️ Sucursal "${sucursal}" no encontrada, usando primera disponible...`);
        store = await prisma.store.findFirst({ where: { active: true, tenantId } });
      }

      if (!store) {
        console.log('❌ No hay sucursales disponibles');
        return;
      }
      
      console.log(`🏪 Sucursal: ${store.name}`);

      // Normalizar fecha a medianoche UTC para consistencia
      const fechaNormalizada = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 12, 0, 0));

      // Intentar reservar el producto si hay uno (pero crear turno igual si no se puede)
      let productId: string | null = null;
      if (producto) {
        // Intentar reservar el producto
        const reservedProduct = await this.reservarProductoParaTurno(producto, tenantId);
        if (reservedProduct) {
          productId = reservedProduct.id;
          console.log(`📦 Producto reservado para turno: ${reservedProduct.model}`);
        } else {
          console.log(`⚠️ No se pudo reservar el producto "${producto}", pero se crea el turno igual`);
          // Continuar sin reservar - el turno se crea con el producto como texto
        }
      }

      // Crear el turno
      console.log(`📝 Creando turno con datos:`, {
        customerName: nombre,
        customerPhone: customerPhone,
        date: fechaNormalizada.toISOString(),
        time: horaFinal,
        product: producto?.trim() || null,
        productId: productId,
        paymentMethod: pago,
        tenantId: tenantId,
        storeId: store.id
      });
      
      try {
        const newAppointment = await prisma.appointment.create({
          data: {
            customerName: nombre,
            customerPhone: customerPhone,
            date: fechaNormalizada,
            time: horaFinal,
            product: producto?.trim() || null,
            productId: productId,
            paymentMethod: pago,
            status: 'CONFIRMED',
            source: 'WHATSAPP',
            tenantId: tenantId,
            storeId: store.id
          }
        });
        console.log(`✅ Turno auto-agendado ID: ${newAppointment.id} - ${nombre} - ${fechaNormalizada.toISOString().split('T')[0]} ${horaFinal} en ${store.name} - Producto: ${producto || 'N/A'} - Pago: ${pago}`);
      } catch (createError) {
        console.error('❌ Error creando turno en DB:', createError);
        // Si falla la creación del turno, liberar el producto reservado
        if (productId) {
          await prisma.product.update({
            where: { id: productId },
            data: { reserved: 0 }
          });
          console.log(`📦 Producto liberado por error en turno`);
        }
      }
    } catch (error) {
      console.error('Error en auto-detección de turno:', error);
    }
  }

  private getNextDayOfWeek(dayOfWeek: number): Date {
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntil = dayOfWeek - currentDay;
    
    // Si daysUntil es negativo, el día ya pasó esta semana, ir a la próxima
    // Si es 0, es hoy mismo (válido para agendar)
    if (daysUntil < 0) daysUntil += 7;
    
    const result = new Date(today);
    result.setDate(today.getDate() + daysUntil);
    
    console.log(`📅 getNextDayOfWeek: hoy=${currentDay}(${today.toDateString()}), buscando día=${dayOfWeek}, daysUntil=${daysUntil}, resultado=${result.toDateString()}`);
    
    return result;
  }

  // Verificar si hay stock disponible (no reservado) de un producto
  private async verificarStockDisponible(producto: string, tenantId?: string): Promise<boolean> {
    try {
      const productoLower = producto.toLowerCase();
      const storageMatch = productoLower.match(/(\d+)\s*gb/i);
      const storage = storageMatch ? storageMatch[1] : null;
      
      // Extraer solo el modelo base (ej: "iPhone 11" de "iPhone 11 128gb blanco")
      const modelMatch = productoLower.match(/iphone\s*(\d+)\s*(pro\s*max|pro|plus)?/i);
      let cleanModel = productoLower.replace(/\d+\s*gb/i, '').replace(/blanco|negro|azul|rojo|verde|rosa|titanio/gi, '').trim();
      
      // Si encontramos patrón de iPhone, usar ese
      if (modelMatch) {
        cleanModel = `iPhone ${modelMatch[1]}${modelMatch[2] ? ' ' + modelMatch[2] : ''}`.trim();
      }
      
      console.log(`🔍 Verificando stock: producto="${producto}", cleanModel="${cleanModel}", storage="${storage}"`);

      const product = await prisma.product.findFirst({
        where: {
          active: true,
          stock: { gt: 0 },
          reserved: { equals: 0 }, // Solo productos NO reservados
          OR: [
            { model: { contains: cleanModel } },
            { name: { contains: cleanModel } }
          ],
          ...(storage ? { storage: { contains: storage } } : {}),
          ...(tenantId ? { tenantId } : {})
        }
      });

      console.log(`🔍 Resultado verificación: ${product ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);
      return product !== null;
    } catch (error) {
      console.error('Error verificando stock:', error);
      return true; // En caso de error, permitir (para no bloquear turnos)
    }
  }

  // Reservar producto para un turno
  private async reservarProductoParaTurno(producto: string, tenantId?: string): Promise<{ id: string; model: string } | null> {
    try {
      const productoLower = producto.toLowerCase();
      const storageMatch = productoLower.match(/(\d+)\s*gb/i);
      const storage = storageMatch ? storageMatch[1] : null;
      
      // Extraer precio si se menciona (ej: "el de 1200", "1200usd", "$1200")
      const priceMatch = productoLower.match(/(\d{3,4})\s*(usd|dolares|dólares|us)?/i);
      const price = priceMatch ? parseInt(priceMatch[1]) : null;
      
      // Extraer solo el modelo base (ej: "iPhone 11" de "iPhone 11 128gb blanco")
      const modelMatch = productoLower.match(/iphone\s*(\d+)\s*(pro\s*max|pro|plus)?/i);
      const numberMatch = productoLower.match(/(\d+)\s*(pro\s*max|pro|plus)?/i);
      let cleanModel = productoLower.replace(/\d+\s*gb/i, '').replace(/blanco|negro|azul|rojo|verde|rosa|titanio|amarillo/gi, '').replace(/\d{3,4}\s*(usd|dolares|dólares|us)?/gi, '').trim();
      
      if (modelMatch) {
        cleanModel = `iPhone ${modelMatch[1]}${modelMatch[2] ? ' ' + modelMatch[2] : ''}`.trim();
      } else if (numberMatch) {
        // Si encontró número pero no "iPhone", agregarlo
        cleanModel = `iPhone ${numberMatch[1]}${numberMatch[2] ? ' ' + numberMatch[2] : ''}`.trim();
      }
      
      // Extraer color si se menciona
      const colorMatch = productoLower.match(/(amarillo|negro|blanco|azul|rojo|verde|rosa|titanio|natural|graphite|silver|gold|purple|midnight|blue|black|white|red|green|pink)/i);
      const color = colorMatch ? colorMatch[1] : null;
      
      console.log(`📦 Intentando reservar: producto="${producto}", cleanModel="${cleanModel}", storage="${storage}", color="${color}", precio=${price}, tenantId=${tenantId}`);

      // Si hay precio, buscar por precio primero
      let product = null;
      
      if (price) {
        // Buscar producto que coincida con el precio (con margen de +-50)
        product = await prisma.product.findFirst({
          where: {
            active: true,
            stock: { gt: 0 },
            reserved: { equals: 0 },
            price: { gte: price - 50, lte: price + 50 },
            OR: [
              { model: { contains: cleanModel } },
              { name: { contains: cleanModel } }
            ],
            ...(storage ? { storage: { contains: storage } } : {}),
            ...(tenantId ? { tenantId } : {})
          },
          orderBy: { price: 'desc' } // Preferir el más caro si hay varios
        });
        
        if (product) {
          console.log(`✅ Producto encontrado por precio ${price}: ${product.model} - $${product.price}`);
        }
      }
      
      // Si no encontró por precio, buscar por modelo
      if (!product) {
        const where: any = {
          active: true,
          stock: { gt: 0 },
          reserved: { equals: 0 },
          OR: [
            { model: { contains: cleanModel } },
            { name: { contains: cleanModel } }
          ],
          ...(tenantId ? { tenantId } : {})
        };
        
        if (storage) {
          where.storage = { contains: storage };
        }
        if (color) {
          where.color = { contains: color, mode: 'insensitive' };
        }
        
        product = await prisma.product.findFirst({
          where,
          orderBy: { price: 'desc' } // Preferir el más caro
        });
      }

      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: { reserved: 1 }
        });
        console.log(`✅ Producto reservado: ${product.model || product.name} - $${product.price} (ID: ${product.id})`);
        return { id: product.id, model: product.model || product.name };
      }
      
      console.log(`⚠️ No se encontró producto para reservar`);
      return null;
    } catch (error) {
      console.error('Error reservando producto para turno:', error);
      return null;
    }
  }

  private getConversation(phone: string) {
    const now = Date.now();
    for (const [key, value] of conversationCache.entries()) {
      if (now - value.lastUpdate > CACHE_TTL) {
        conversationCache.delete(key);
      }
    }
    let conversation = conversationCache.get(phone);
    if (!conversation) {
      conversation = { messages: [], lastUpdate: now };
      conversationCache.set(phone, conversation);
    }
    return conversation;
  }

  // Guardar nombre del contacto de WhatsApp
  private saveContactName(phone: string, name: string) {
    if (name && name.trim()) {
      contactNamesCache.set(phone, name.trim());
    }
  }

  // Obtener nombre del contacto
  private getContactName(phone: string): string | null {
    return contactNamesCache.get(phone) || null;
  }

  private async getFullSystemContext(customerPhone: string, message: string): Promise<{ context: string; tenantConfig: TenantConfig }> {
    try {
      let context = '\n\n========== CONTEXTO DEL SISTEMA ==========';
      let tenantConfig: TenantConfig = { ...DEFAULT_TENANT_CONFIG };

      // Obtener el tenant actual
      const tenantData = await getTenantByWhatsAppNumber();
      if (!tenantData) {
        console.log('⚠️ No se encontró tenant, usando config por defecto');
        return { context: '', tenantConfig: DEFAULT_TENANT_CONFIG };
      }
      
      const tenantId = tenantData.id;
      tenantConfig = tenantData.config;

      // FECHA Y HORA ACTUAL - MUY IMPORTANTE PARA TURNOS
      const now = new Date();
      const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const diaSemana = diasSemana[now.getDay()];
      const dia = now.getDate();
      const mes = meses[now.getMonth()];
      const año = now.getFullYear();
      const hora = now.getHours();
      const minutos = String(now.getMinutes()).padStart(2, '0');
      
      context += `\n\n=== FECHA Y HORA ACTUAL ===`;
      context += `\nHOY ES: ${diaSemana} ${dia} de ${mes} de ${año}`;
      context += `\nHORA ACTUAL: ${hora}:${minutos}`;
      context += `\nFECHA FORMATO ISO (para el tag): ${now.toISOString().split('T')[0]}`;
      
      // Calcular mañana
      const manana = new Date(now);
      manana.setDate(manana.getDate() + 1);
      context += `\nMAÑANA ES: ${diasSemana[manana.getDay()]} ${manana.getDate()} de ${meses[manana.getMonth()]} (${manana.toISOString().split('T')[0]})`;
      
      context += `\n\nIMPORTANTE PARA TURNOS:`;
      context += `\n- Si dicen "hoy" usa fecha: ${now.toISOString().split('T')[0]}`;
      context += `\n- Si dicen "mañana" usa fecha: ${manana.toISOString().split('T')[0]}`;
      context += `\n- Si dicen "a las 4" o "4pm" significa 16:00`;
      context += `\n- Si dicen "a las 10" o "10am" significa 10:00`;
      context += `\n- SIEMPRE usa formato HH:MM (ej: 16:00, 10:30)`;

      // 0. Nombre del contacto de WhatsApp (si lo tenemos)
      const contactName = this.getContactName(customerPhone);
      if (contactName) {
        context += `\n\nNOMBRE DEL CLIENTE: ${contactName}`;
        context += `\n(Si el nombre se puede abreviar naturalmente, usá el apodo)`;
      }

      // 1. Info del negocio
      context += `\nNEGOCIO: ${tenantConfig.name}`;
      
      // Obtener más info del tenant
      const tenantInfo = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { instagram: true, phone: true, address: true }
      });
      if (tenantInfo?.instagram) context += ` | IG: @${tenantInfo.instagram.replace('@', '')}`;

      // 2. Sucursales con horarios - FILTRADO POR TENANT
      const stores = await prisma.store.findMany({
        where: { active: true, tenantId },
        select: { 
          name: true, address: true, phone: true, googleMapsUrl: true,
          mondayHours: true, tuesdayHours: true, wednesdayHours: true,
          thursdayHours: true, fridayHours: true, saturdayHours: true, sundayHours: true,
          appointmentDuration: true
        }
      });
      
      if (stores.length > 0) {
        context += '\n\n=== SUCURSALES ===';
        stores.forEach(s => {
          context += `\n• ${s.name}`;
          if (s.address) context += ` - ${s.address}`;
          if (s.phone) context += ` - Tel: ${s.phone}`;
          if (s.googleMapsUrl) context += ` | Maps: ${s.googleMapsUrl}`;
          
          // Horarios
          const horarios: string[] = [];
          if (s.mondayHours) horarios.push(`Lun-Vie: ${s.mondayHours}`);
          if (s.saturdayHours) horarios.push(`Sáb: ${s.saturdayHours}`);
          if (s.sundayHours) horarios.push(`Dom: ${s.sundayHours}`);
          else horarios.push('Dom: Cerrado');
          
          if (horarios.length > 0) context += ` | ${horarios.join(' | ')}`;
          if (s.appointmentDuration) context += ` | Turnos cada ${s.appointmentDuration} min`;
        });
        
        context += '\n\n(Si preguntan cómo llegar, pasá la dirección y el link de Google Maps)';
      }

      context += `\nGARANTÍA: ${tenantConfig.botWarrantyDays} días en todos los equipos`;
      context += `\nFORMAS DE PAGO: ${tenantConfig.botPaymentMethods.split(',').join(', ')}`;

      // 4. Stock de celulares - FILTRADO POR TENANT
      const phones = await prisma.product.findMany({
        where: { active: true, category: 'PHONE', stock: { gt: 0 }, tenantId },
        select: {
          model: true, storage: true, color: true, price: true,
          battery: true, condition: true, stock: true, reserved: true,
          store: { select: { name: true } }
        },
        orderBy: [{ model: 'asc' }, { storage: 'asc' }]
      });

      context += '\n\n=== CELULARES EN STOCK ===';
      context += '\n(Precios en USD - Cuando pidan lista, mostrá agrupado por modelo/storage/precio con todos los colores)';

      if (phones.length > 0) {
        // Ordenar por número de modelo
        const sortedPhones = this.sortPhonesByModel(phones);
        
        // Agrupar por modelo + storage + precio + batería
        const grouped: Record<string, {
          model: string;
          storage: string;
          price: number;
          battery: number;
          colors: string[];
          count: number;
        }> = {};
        
        sortedPhones.forEach(phone => {
          if (phone.reserved > 0) return; // Saltar reservados
          
          const key = `${phone.model}|${phone.storage}|${phone.price}|${phone.battery}`;
          if (!grouped[key]) {
            grouped[key] = {
              model: phone.model || '',
              storage: phone.storage || '',
              price: phone.price,
              battery: phone.battery || 100,
              colors: [],
              count: 0
            };
          }
          if (phone.color && !grouped[key].colors.includes(phone.color.toLowerCase())) {
            grouped[key].colors.push(phone.color.toLowerCase());
          }
          grouped[key].count++;
        });
        
        // Generar lista compacta
        Object.values(grouped).forEach(item => {
          const modelShort = item.model.replace('iPhone ', '');
          const coloresStr = item.colors.length > 0 ? `(colores ${item.colors.join('/')})` : '';
          const bateriaEmoji = item.battery >= 95 ? '100🔋' : `${item.battery}%🔋`;
          
          context += `\n* ${modelShort} ${item.storage} ${bateriaEmoji}${coloresStr} - ${item.price} U$`;
        });
        
        context += `\n\nTOTAL: ${phones.filter(p => p.reserved === 0).length} equipos disponibles`;
      } else {
        context += '\nNo hay celulares en stock';
      }

      // 5. Accesorios - agrupados por tipo - FILTRADO POR TENANT
      const accessories = await prisma.product.findMany({
        where: { active: true, category: 'ACCESSORY', stock: { gt: 0 }, tenantId },
        select: { name: true, price: true, stock: true },
        orderBy: { name: 'asc' }
      });

      if (accessories.length > 0) {
        context += '\n\n=== ACCESORIOS (precios en PESOS ARS) ===';
        const accByType: Record<string, Array<{name: string, price: number}>> = {};
        accessories.forEach(a => {
          const type = this.getAccessoryType(a.name);
          if (!accByType[type]) accByType[type] = [];
          accByType[type].push({ name: a.name, price: a.price });
        });
        
        Object.entries(accByType).forEach(([type, items]) => {
          const itemsStr = items.map(i => `${i.name} $${i.price.toLocaleString('es-AR')}`).join(', ');
          context += `\n${type}: ${itemsStr}`;
        });
      }

      // 6. Buscar cliente existente con historial de compras - FILTRADO POR TENANT
      const existingClient = await prisma.client.findFirst({
        where: { phone: { contains: customerPhone.slice(-8) }, tenantId },
        select: { 
          name: true, 
          id: true,
          sales: {
            where: { cancelled: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              createdAt: true,
              total: true,
              items: {
                select: {
                  product: { select: { name: true, model: true, category: true } }
                }
              }
            }
          }
        }
      });
      
      if (existingClient) {
        context += `\n\n=== CLIENTE CONOCIDO ===`;
        context += `\nNombre: ${existingClient.name}`;
        
        if (existingClient.sales && existingClient.sales.length > 0) {
          context += `\nCompras anteriores (${existingClient.sales.length}):`;
          const ahora = new Date();
          existingClient.sales.forEach(sale => {
            const fecha = sale.createdAt.toLocaleDateString('es-AR');
            const productos = sale.items.map(i => i.product?.model || i.product?.name).filter(Boolean).join(', ');
            const diasDesdeCompra = Math.floor((ahora.getTime() - sale.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            const enGarantia = diasDesdeCompra <= 30;
            const garantiaInfo = enGarantia 
              ? `[EN GARANTÍA - ${30 - diasDesdeCompra} días restantes]` 
              : `[SIN GARANTÍA - hace ${diasDesdeCompra} días]`;
            context += `\n• ${fecha}: ${productos} ($${sale.total.toLocaleString('es-AR')}) ${garantiaInfo}`;
          });
          context += `\n(Tratalo con confianza, ya es cliente. Si tiene problema con equipo EN GARANTÍA, ofrecé solución. Si está SIN GARANTÍA, derivá al staff)`;
        }
      }

      // 7. Turnos del cliente (activos) - FILTRADO POR TENANT
      const clientAppointments = await prisma.appointment.findMany({
        where: {
          customerPhone: { contains: customerPhone.slice(-8) },
          status: { not: 'CANCELLED' },
          date: { gte: new Date() },
          tenantId
        },
        select: { date: true, time: true, status: true, product: true, store: { select: { name: true } } },
        orderBy: { date: 'asc' },
        take: 3
      });

      if (clientAppointments.length > 0) {
        context += '\n\n=== TURNOS ACTIVOS DEL CLIENTE ===';
        clientAppointments.forEach(t => {
          const fecha = t.date.toLocaleDateString('es-AR');
          context += `\n• ${fecha} ${t.time} - ${t.store?.name || 'Sin sucursal'} - ${t.product || 'Sin producto'} (${t.status})`;
        });
      }

      // Turnos cancelados recientemente (últimas 24hs) - FILTRADO POR TENANT
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const cancelledAppointments = await prisma.appointment.findMany({
        where: {
          customerPhone: { contains: customerPhone.slice(-8) },
          status: 'CANCELLED',
          updatedAt: { gte: yesterday },
          tenantId
        },
        select: { date: true, time: true, product: true, store: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 2
      });

      if (cancelledAppointments.length > 0) {
        context += '\n\n=== ⚠️ TURNO CANCELADO RECIENTEMENTE ===';
        context += '\nACCIÓN: Le acabamos de cancelar el turno a este cliente. Si pregunta "por qué" o algo similar:';
        context += '\n- Decile que surgió un inconveniente y pedile disculpas';
        context += '\n- Ofrecele reagendar para otro día/horario';
        context += '\n- NO inventes excusas específicas, solo decí que hubo un problema';
        cancelledAppointments.forEach(t => {
          const fecha = t.date.toLocaleDateString('es-AR');
          context += `\n• TURNO CANCELADO: ${fecha} ${t.time} - ${t.product || 'Sin producto especificado'}`;
        });
      }

      // Turnos modificados recientemente (últimas 24hs) - FILTRADO POR TENANT
      const modifiedAppointments = await prisma.appointment.findMany({
        where: {
          customerPhone: { contains: customerPhone.slice(-8) },
          status: { not: 'CANCELLED' },
          updatedAt: { gte: yesterday },
          createdAt: { lt: yesterday }, // Fue creado antes de ayer = fue modificado
          tenantId
        },
        select: { date: true, time: true, product: true, store: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 2
      });

      if (modifiedAppointments.length > 0) {
        context += '\n\n=== ⚠️ TURNO MODIFICADO RECIENTEMENTE ===';
        context += '\nACCIÓN: Le acabamos de modificar el turno a este cliente.';
        modifiedAppointments.forEach(t => {
          const fecha = t.date.toLocaleDateString('es-AR');
          context += `\n• NUEVO TURNO: ${fecha} ${t.time} - ${t.product || 'Sin producto'}`;
        });
      }

      // 8. Reparaciones del cliente (si pregunta) - FILTRADO POR TENANT
      const msgLower = message.toLowerCase();
      if (msgLower.includes('reparacion') || msgLower.includes('reparación') || msgLower.includes('arreglo')) {
        const repairs = await prisma.repair.findMany({
          where: {
            client: { phone: { contains: customerPhone.slice(-8) }, tenantId },
            status: { not: 'DELIVERED' },
            tenantId
          },
          select: { code: true, deviceModel: true, status: true, estimatedCost: true, diagnosis: true },
          take: 5
        });

        if (repairs.length > 0) {
          context += '\n\n=== REPARACIONES DEL CLIENTE ===';
          repairs.forEach(r => {
            context += `\n• ${r.code || 'Sin código'} - ${r.deviceModel} - ${this.getRepairStatus(r.status)}`;
            if (r.estimatedCost) context += ` - Presupuesto: $${r.estimatedCost.toLocaleString('es-AR')}`;
          });
        }
      }

      // 9. Fotos disponibles - FILTRADO POR TENANT
      const availablePhotos = await prisma.productPhoto.findMany({
        where: { active: true, tenantId },
        select: { modelName: true },
        distinct: ['modelName']
      });
      
      if (availablePhotos.length > 0) {
        context += '\n\n=== FOTOS DISPONIBLES ===';
        context += '\nModelos con fotos: ' + availablePhotos.map(p => p.modelName).join(', ');
        context += '\n(Si piden foto de alguno de estos modelos, se envía automáticamente)';
        context += '\n(Si piden foto de un modelo sin fotos, decí que no tenés foto en este momento)';
      }

      return { context, tenantConfig };
    } catch (error) {
      console.error('Error obteniendo contexto:', error);
      return { context: '', tenantConfig: DEFAULT_TENANT_CONFIG };
    }
  }

  private sortPhonesByModel(phones: any[]): any[] {
    return phones.sort((a, b) => {
      const getModelNumber = (model: string) => {
        const match = model?.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      const getVariant = (model: string) => {
        if (model?.toLowerCase().includes('pro max')) return 3;
        if (model?.toLowerCase().includes('pro')) return 2;
        if (model?.toLowerCase().includes('plus')) return 1;
        return 0;
      };
      
      const numA = getModelNumber(a.model || '');
      const numB = getModelNumber(b.model || '');
      if (numA !== numB) return numA - numB;
      
      return getVariant(a.model || '') - getVariant(b.model || '');
    });
  }

  private groupPhones(phones: any[]): Record<string, any> {
    const grouped: Record<string, {
      colors: string[], batteries: number[], prices: number[], 
      stores: string[], count: number, available: number
    }> = {};

    phones.forEach(p => {
      const key = `${p.model || 'Sin modelo'} ${p.storage || ''}`.trim();
      if (!grouped[key]) {
        grouped[key] = { colors: [], batteries: [], prices: [], stores: [], count: 0, available: 0 };
      }
      grouped[key].count++;
      if (!p.reserved || p.reserved === 0) grouped[key].available++;
      if (p.color && !grouped[key].colors.includes(p.color)) grouped[key].colors.push(p.color);
      if (p.battery) grouped[key].batteries.push(p.battery);
      if (p.price) grouped[key].prices.push(p.price);
      if (p.store?.name && !grouped[key].stores.includes(p.store.name)) grouped[key].stores.push(p.store.name);
    });

    return grouped;
  }

  private getAccessoryType(name: string): string {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('funda') || nameLower.includes('case')) return 'Fundas';
    if (nameLower.includes('vidrio') || nameLower.includes('protector')) return 'Protectores';
    if (nameLower.includes('cargador') || nameLower.includes('cable')) return 'Cargadores';
    if (nameLower.includes('auricular') || nameLower.includes('airpod')) return 'Auriculares';
    return 'Otros';
  }

  private getRepairStatus(status: string): string {
    const map: Record<string, string> = {
      'RECEIVED': 'Recibido', 'DIAGNOSING': 'En diagnóstico',
      'WAITING_PARTS': 'Esperando repuestos', 'IN_PROGRESS': 'En reparación',
      'READY': 'Listo para retirar', 'DELIVERED': 'Entregado', 'CANCELLED': 'Cancelado'
    };
    return map[status] || status;
  }

  private async generateResponse(
    history: Array<{role: string, content: string}>,
    systemContext: string,
    tenantConfig: TenantConfig = DEFAULT_TENANT_CONFIG
  ): Promise<string> {
    if (!this.client) throw new Error('Cliente no inicializado');

    const messages = history.slice(-30).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000, // Aumentado para poder enviar listas largas
      system: getSystemPrompt(tenantConfig) + systemContext,
      messages: messages
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  private async logMessage(phone: string, message: string, response: string) {
    try {
      // Obtener nombre del contacto del cache
      const contactName = this.getContactName(phone);
      
      // Obtener el tenant actual
      const tenantData = await getTenantByWhatsAppNumber();
      const tenantId = tenantData?.id;
      
      await prisma.chatMessage.create({
        data: {
          customerPhone: phone,
          customerName: contactName,
          message: message,
          response: response,
          intent: 'GENERAL',
          status: 'responded',
          platform: 'whatsapp',
          ...(tenantId ? { tenantId } : {})
        }
      });
    } catch (error) {
      console.error('Error guardando mensaje:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`🤖 Chatbot ${enabled ? 'habilitado' : 'deshabilitado'}`);
  }

  isActive(): boolean {
    return this.isEnabled && this.client !== null;
  }

  // Agregar mensaje del sistema al contexto de conversación
  // Esto permite que el bot sepa que envió un mensaje (ej: modificación de turno)
  addSystemMessage(phone: string, message: string) {
    const cleanPhone = phone.replace(/@s\.whatsapp\.net|@lid|@g\.us|@c\.us/g, '').replace(/\D/g, '');
    const conversation = this.getConversation(cleanPhone);
    conversation.messages.push({ role: 'assistant', content: message });
    conversation.lastUpdate = Date.now();
    conversationCache.set(cleanPhone, conversation);
    console.log(`📝 Mensaje del sistema agregado al contexto de ${cleanPhone}`);
  }
}

export const chatbotService = new ChatbotService();
