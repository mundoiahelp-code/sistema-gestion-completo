import Anthropic from '@anthropic-ai/sdk';

class AnthropicService {
  private client: Anthropic | null = null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      console.log('✅ Anthropic client initialized');
    } else {
      console.log('⚠️  ANTHROPIC_API_KEY not found - bot responses disabled');
    }
  }

  async generateResponse(message: string, context?: any): Promise<string> {
    if (!this.client) {
      console.log('⚠️  Anthropic client not initialized');
      return 'Lo siento, el bot no está disponible en este momento.';
    }

    try {
      const systemPrompt = `Sos un asistente virtual de ventas argentino. Tu trabajo es ayudar a los clientes con consultas sobre productos, precios, stock y turnos.

PERSONALIDAD:
- Hablás como un argentino amigable y cercano
- Usás lenguaje informal pero profesional
- Sos directo y claro
- No usás emojis excesivamente

REGLAS:
- Respondé de forma breve y concisa
- Si no sabés algo, decilo honestamente
- Si necesitan hablar con un humano, ofrecé pasarlos con un asesor
- Nunca inventes información sobre productos o precios`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      });

      const textContent = response.content.find(c => c.type === 'text');
      return textContent && 'text' in textContent ? textContent.text : 'No pude generar una respuesta.';
    } catch (error: any) {
      console.error('❌ Error generating response:', error.message);
      return 'Disculpá, tuve un problema. ¿Podés repetir?';
    }
  }
}

export const anthropicService = new AnthropicService();
export default AnthropicService;
