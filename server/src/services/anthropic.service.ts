// Dummy Anthropic service for production (bot runs separately)
class AnthropicService {
  async generateResponse(prompt: string) {
    console.log('⚠️ Anthropic service disabled in production mode');
    return 'Service not available';
  }
}

export const anthropicService = new AnthropicService();
export default AnthropicService;
