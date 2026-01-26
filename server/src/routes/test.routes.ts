import { Router, Request, Response } from 'express';

const router = Router();

// Endpoint de prueba para Resend
router.get('/test-email', async (req: Request, res: Response) => {
  try {
    const { to } = req.query;
    
    if (!to || typeof to !== 'string') {
      return res.status(400).json({ error: 'Parámetro "to" requerido' });
    }
    
    console.log('🧪 Testing Resend...');
    console.log('📧 Enviando email de prueba a:', to);
    console.log('🔑 RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Configurada' : 'NO CONFIGURADA');
    console.log('📨 RESEND_FROM:', process.env.RESEND_FROM || 'onboarding@resend.dev');
    
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: [to],
      subject: 'Test Email - MundoIAple',
      html: '<h1>¡Email de prueba!</h1><p>Si recibiste este email, Resend está funcionando correctamente.</p>'
    });
    
    console.log('✅ Email enviado:', result);
    
    res.json({
      success: true,
      message: 'Email enviado',
      result
    });
    
  } catch (error: any) {
    console.error('❌ Error enviando email de prueba:', error);
    res.status(500).json({
      error: 'Error enviando email',
      details: error.message,
      stack: error.stack
    });
  }
});

export default router;
