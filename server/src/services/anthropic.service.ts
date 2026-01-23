import Anthropic from '@anthropic-ai/sdk';

class AnthropicService {
  private client: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  async generateRepairMessage(data: {
    clientName: string;
    whatsappName?: string | null;
    deviceModel: string;
    repairName: string;
    cost: string;
    deliveryDate: string;
    deliveryTime: string;
    office: string;
    address?: string;
  }): Promise<string> {
    // Siempre usar el fallback para tener control total del mensaje
    return this.generateFallbackMessage(data);
  }

  private generateFallbackMessage(data: {
    clientName: string;
    whatsappName?: string | null;
    deviceModel: string;
    repairName: string;
    cost: string;
    deliveryDate: string;
    deliveryTime: string;
    office: string;
    address?: string;
  }): string {
    const locationInfo = data.address
      ? `${data.office} (${data.address})`
      : data.office;

    const templates = [
      `Buenas! Ya está listo tu ${data.deviceModel}, se arregló ${data.repairName.toLowerCase()}. Te queda $${data.cost}. Podés pasar el ${data.deliveryDate} a las ${data.deliveryTime} por ${locationInfo}. Avisame cualquier cosa!`,
      `Buenas! Tu ${data.deviceModel} ya está. ${data.repairName} listo, son $${data.cost}. Podés venir el ${data.deliveryDate} a las ${data.deliveryTime} a ${locationInfo}. Avisame cualquier cosa!`,
      `Buenas! Listo tu ${data.deviceModel}. ${data.repairName} arreglado, $${data.cost}. Te espero el ${data.deliveryDate} a las ${data.deliveryTime} en ${locationInfo}. Avisame cualquier cosa!`,
      `Buenas! Ya quedó el ${data.deviceModel}. Se le hizo ${data.repairName.toLowerCase()}, son $${data.cost}. Pasá el ${data.deliveryDate} a las ${data.deliveryTime} por ${locationInfo}. Avisame cualquier cosa!`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }
}

export const anthropicService = new AnthropicService();
