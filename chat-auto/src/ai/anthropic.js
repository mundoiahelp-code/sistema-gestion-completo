import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/config.js';
import { SYSTEM_PROMPT, buildContextPrompt } from './prompts.js';

class AnthropicClient {
  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey
    });
  }

  async generateResponse(userMessage, context = {}) {
    try {
      const { customerData, phones, accessories, stores, conversationHistory } = context;

      // Construir el contexto completo con toda la info del sistema
      const contextPrompt = buildContextPrompt({
        customerData,
        phones,
        accessories,
        stores
      });

      // Preparar mensajes
      const messages = [];

      // Agregar historial de conversación si existe (últimos 10 mensajes para contexto)
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-10);
        recentHistory.forEach(msg => {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          });
        });
      }

      // Agregar mensaje actual del usuario
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Llamar a Claude
      const response = await this.client.messages.create({
        model: config.anthropic.model,
        max_tokens: config.anthropic.maxTokens,
        system: SYSTEM_PROMPT + contextPrompt,
        messages: messages
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Error al generar respuesta con Anthropic:', error);
      throw error;
    }
  }

  async analyzeIntent(userMessage) {
    try {
      const response = await this.client.messages.create({
        model: config.anthropic.model,
        max_tokens: 200,
        system: `Analizá el mensaje del cliente y devolvé SOLO una de estas intenciones:

VENTAS:
- CONSULTA_STOCK: pregunta por modelos disponibles
- CONSULTA_PRECIO: pregunta por precios  
- QUIERE_COMPRAR: quiere comprar o reservar
- PIDE_FINANCIACION: pregunta por cuotas o formas de pago

PAGOS:
- PIDE_LINK_PAGO: quiere link de pago de MercadoPago
- PIDE_ALIAS: pide alias para transferir
- PIDE_CVU: pide CVU para transferir
- PIDE_DATOS_TRANSFERENCIA: pide datos para hacer transferencia
- CONFIRMA_PAGO: dice que ya pagó o transfirió ("ya te transferí", "listo pagué", "ya hice el pago")
- YA_PAGUE: confirma que realizó el pago
- YA_TRANSFERI: confirma que hizo la transferencia

TURNOS:
- PIDE_TURNO: quiere agendar turno
- MODIFICA_TURNO: quiere cambiar turno
- CANCELA_TURNO: quiere cancelar turno
- CONSULTA_TURNO: pregunta por su turno agendado

REEMBOLSOS:
- PIDE_REEMBOLSO: quiere devolver producto
- PIDE_CAMBIO: quiere cambiar producto
- PRODUCTO_DEFECTUOSO: el producto tiene fallas

QUEJAS:
- RECLAMO: tiene un problema o queja
- MALA_ATENCION: se queja del servicio
- PRODUCTO_MAL_ESTADO: producto llegó dañado

SOPORTE:
- AYUDA_TECNICA: necesita ayuda técnica
- CONFIGURACION: ayuda para configurar dispositivo
- GARANTIA: pregunta por garantía

GENERALES:
- CONSULTA_HORARIOS: pregunta horarios/ubicación<<
- CONSULTA_ENVIOS: pregunta por envíos
- SALUDO: solo saluda
- DESPEDIDA: se despide
- OTRO: no encaja en ninguna categoría

Respondé SOLO con la intención, sin explicaciones.`,
        messages: [{
          role: 'user',
          content: userMessage
        }]
      });

      return response.content[0].text.trim();
    } catch (error) {
      console.error('Error al analizar intención:', error);
      return 'OTRO';
    }
  }

  async extractProductInfo(userMessage) {
    try {
      const response = await this.client.messages.create({
        model: config.anthropic.model,
        max_tokens: 300,
        system: `Extraé información de productos del mensaje del cliente.
Devolvé un JSON con esta estructura:
{
  "modelo": "iPhone 13 Pro" o null,
  "gb": "128" o null,
  "color": "Plata" o null,
  "presupuesto": "50000" o null
}

Si no hay información, devolvé null en ese campo.
Respondé SOLO con el JSON, sin explicaciones.`,
        messages: [{
          role: 'user',
          content: userMessage
        }]
      });

      const jsonText = response.content[0].text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Error al extraer info de producto:', error);
      return null;
    }
  }

  async extractAppointmentInfo(userMessage, conversationHistory = []) {
    try {
      // Obtener fecha actual para contexto
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const dayOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][today.getDay()];
      
      const response = await this.client.messages.create({
        model: config.anthropic.model,
        max_tokens: 400,
        system: `Extraé información del turno del mensaje. Hoy es ${dayOfWeek} ${todayStr}.

Devolvé un JSON con:
{
  "fecha": "YYYY-MM-DD" o null,
  "hora": "HH:MM" o null,
  "nombre": "nombre del cliente" o null,
  "producto": "producto que quiere ver/comprar" o null,
  "sucursal": "sucursal preferida" o null,
  "tiene_info_completa": true/false
}

Interpretá expresiones como:
- "mañana" = fecha de mañana
- "pasado mañana" = fecha en 2 días
- "el lunes" = próximo lunes
- "a las 3" = 15:00
- "a la tarde" = 16:00 aprox

Si falta fecha u hora, tiene_info_completa = false.
Respondé SOLO con el JSON.`,
        messages: [{
          role: 'user',
          content: `Historial: ${JSON.stringify(conversationHistory.slice(-5))}\n\nMensaje actual: ${userMessage}`
        }]
      });

      const jsonText = response.content[0].text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Error al extraer info de turno:', error);
      return null;
    }
  }

  async generatePaymentLink(productInfo, customerData) {
    try {
      // Aquí se integraría con MercadoPago
      // Por ahora simulamos la generación del link
      const amount = productInfo.precio || productInfo.presupuesto;
      const description = `${productInfo.modelo} ${productInfo.gb}GB ${productInfo.color}`;
      
      // Simular link de MercadoPago
      const mockLink = `https://mpago.la/abc123?amount=${amount}&description=${encodeURIComponent(description)}`;
      
      return {
        success: true,
        link: mockLink,
        amount: amount,
        description: description
      };
    } catch (error) {
      console.error('Error al generar link de pago:', error);
      return {
        success: false,
        error: 'No pude generar el link de pago'
      };
    }
  }

  async analyzeComplaint(userMessage) {
    try {
      const response = await this.client.messages.create({
        model: config.anthropic.model,
        max_tokens: 400,
        system: `Analizá la queja del cliente y devolvé un JSON con:
{
  "tipo": "PRODUCTO_DEFECTUOSO" | "MALA_ATENCION" | "DEMORA_ENTREGA" | "PRECIO_INCORRECTO" | "OTRO",
  "gravedad": "BAJA" | "MEDIA" | "ALTA",
  "requiere_escalamiento": true/false,
  "solucion_sugerida": "descripción de la solución"
}

Respondé SOLO con el JSON.`,
        messages: [{
          role: 'user',
          content: userMessage
        }]
      });

      const jsonText = response.content[0].text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Error al analizar queja:', error);
      return {
        tipo: 'OTRO',
        gravedad: 'MEDIA',
        requiere_escalamiento: false,
        solucion_sugerida: 'Revisar caso manualmente'
      };
    }
  }

  async generateVariedResponse(baseResponse, conversationHistory) {
    try {
      // Evitar respuestas repetitivas
      const recentResponses = conversationHistory
        .filter(msg => msg.role === 'assistant')
        .slice(-3)
        .map(msg => msg.content);

      if (recentResponses.some(resp => resp === baseResponse)) {
        const response = await this.client.messages.create({
          model: config.anthropic.model,
          max_tokens: 300,
          system: `Reescribí esta respuesta de forma diferente pero manteniendo el mismo mensaje:
"${baseResponse}"

Variá las palabras y expresiones pero conservá el tono argentino y natural.
Respondé SOLO con la nueva versión.`,
          messages: [{
            role: 'user',
            content: 'Reescribí la respuesta de forma diferente'
          }]
        });

        return response.content[0].text.trim();
      }

      return baseResponse;
    } catch (error) {
      console.error('Error al generar respuesta variada:', error);
      return baseResponse;
    }
  }
}

export default AnthropicClient;
