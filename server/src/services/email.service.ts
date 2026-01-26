import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(__dirname, '../../system-config.json');

// Inicializar Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

if (resend) {
  console.log('✅ Resend configurado correctamente');
} else {
  console.warn('⚠️ RESEND_API_KEY no configurada - Los emails no se enviarán');
}

// Cargar configuración
const loadConfig = () => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }
  return null;
};

// Función genérica para enviar emails con Resend
const sendEmail = async (to: string, subject: string, html: string) => {
  // En desarrollo o si no hay dominio verificado, usar el dominio de prueba de Resend
  const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
  
  console.log(`📧 Enviando email a: ${to}`);
  console.log(`📧 From: ${fromEmail}`);
  console.log(`📧 Subject: ${subject}`);
  
  if (!resend) {
    console.log(`📧 [MOCK] Email no enviado (Resend no configurado)`);
    return false;
  }
  
  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
    });
    console.log(`✅ Email enviado exitosamente:`, result);
    return true;
  } catch (error: any) {
    console.error(`❌ Error Resend:`, error);
    console.error(`❌ Error details:`, JSON.stringify(error, null, 2));
    throw error;
  }
};

// === EMAIL DE BIENVENIDA + VERIFICACIÓN (código de 6 dígitos) ===
interface VerificationEmailData {
  to: string;
  ownerName: string;
  verificationCode: string;
  locale?: string;
}

export const sendVerificationEmail = async (data: VerificationEmailData) => {
  const { to, ownerName, verificationCode } = data;
  const config = loadConfig();
  
  const supportEmail = config?.system?.supportEmail || 'sistema@mundoaple.store';
  
  const subject = `Bienvenido a MundoIAple – Verificá tu cuenta`;
  const html = generateWelcomeVerificationHtml(ownerName, verificationCode, supportEmail);

  try {
    await sendEmail(to, subject, html);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error);
    return false;
  }
};

function generateWelcomeVerificationHtml(ownerName: string, code: string, supportEmail: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a MundoIAple</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, 'Segoe UI', sans-serif; background-color: #f4f4f4; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #2c3e50; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: normal; font-family: Arial, Helvetica, sans-serif;">MundoIAple</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 35px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Hola,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Te damos la bienvenida a <strong>MundoIAple</strong>. Estamos muy contentos de que formes parte de nuestra plataforma.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Para completar tu registro, ingresá el siguiente código de verificación:
              </p>
              
              <!-- Verification Code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #ecf0f1; border: 2px solid #2c3e50; border-radius: 6px; padding: 20px 30px; display: inline-block;">
                      <span style="font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace;">
                        ${code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 20px 0; color: #555555; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">
                Este código es personal y tiene una validez de 15 minutos por razones de seguridad. Si no solicitaste este registro, podés ignorar este mensaje.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Ante cualquier inconveniente, nuestro equipo está disponible para ayudarte.
              </p>
              
              <p style="margin: 0 0 5px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Saludos cordiales,
              </p>
              <p style="margin: 0; color: #2c3e50; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">
                Equipo de MundoIAple
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 25px 35px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">
                ¿Necesitás ayuda? Escribinos a <a href="mailto:${supportEmail}" style="color: #2c3e50; text-decoration: none;">${supportEmail}</a>
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; font-family: Arial, Helvetica, sans-serif;">
                © 2023 MundoIAple. Todos los derechos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// === EMAIL DE RESET DE PASSWORD ===
interface PasswordResetEmailData {
  to: string;
  userName: string;
  resetLink: string;
  locale?: string;
}

export const sendPasswordResetEmail = async (data: PasswordResetEmailData) => {
  const { to, userName, resetLink } = data;
  const config = loadConfig();
  
  const supportEmail = config?.system?.supportEmail || 'sistema@mundoaple.store';
  
  const subject = `Restablecer contraseña – MundoIAple`;
  const html = generatePasswordResetHtml(userName, resetLink, supportEmail);

  try {
    await sendEmail(to, subject, html);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de reset:', error);
    return false;
  }
};

function generatePasswordResetHtml(userName: string, resetLink: string, supportEmail: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña - MundoIAple</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, 'Segoe UI', sans-serif; background-color: #f4f4f4; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #c0392b; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: normal; font-family: Arial, Helvetica, sans-serif;">MundoIAple</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 35px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Hola,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Recibimos una solicitud para <strong>restablecer la contraseña</strong> de tu cuenta en MundoIAple.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Para crear una nueva contraseña, hacé clic en el siguiente botón:
              </p>
              
              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background-color: #c0392b; color: #ffffff; text-decoration: none; padding: 15px 35px; border-radius: 5px; font-size: 16px; font-weight: normal; font-family: Arial, Helvetica, sans-serif;">
                      Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 20px 0; color: #555555; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">
                Si no realizaste esta solicitud, te recomendamos ignorar este mensaje. Tu cuenta permanecerá segura.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #555555; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">
                Por motivos de seguridad, este código tiene una duración limitada.
              </p>
              
              <p style="margin: 0 0 5px 0; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                Saludos cordiales,
              </p>
              <p style="margin: 0; color: #c0392b; font-size: 16px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">
                Equipo de MundoIAple
              </p>
              
              <!-- Alternative Link -->
              <div style="margin: 30px 0 0 0; padding: 20px 0; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 10px 0; color: #888888; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">
                  Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                </p>
                <p style="margin: 0; color: #2c3e50; font-size: 12px; word-break: break-all; font-family: Arial, Helvetica, sans-serif;">
                  ${resetLink}
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 25px 35px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">
                ¿Necesitás ayuda? Escribinos a <a href="mailto:${supportEmail}" style="color: #c0392b; text-decoration: none;">${supportEmail}</a>
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; font-family: Arial, Helvetica, sans-serif;">
                © 2023 MundoIAple. Todos los derechos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
