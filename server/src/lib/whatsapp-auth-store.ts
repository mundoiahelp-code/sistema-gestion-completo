import { prisma } from './prisma';
import {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
} from '@whiskeysockets/baileys';

const SESSION_ID = 'default';

/**
 * Guarda y recupera la sesión de WhatsApp desde PostgreSQL
 * Reemplaza useMultiFileAuthState para persistencia en la nube
 */
export async function usePostgresAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  // Intentar cargar sesión existente
  let creds: AuthenticationCreds;
  let keys: Record<string, any> = {};

  try {
    const session = await (prisma as any).whatsAppSession.findUnique({
      where: { sessionId: SESSION_ID },
    });

    if (session?.data) {
      const parsed = JSON.parse(session.data, BufferJSON.reviver);
      creds = parsed.creds || initAuthCreds();
      keys = parsed.keys || {};
      console.log('✅ Sesión de WhatsApp cargada desde la base de datos');
    } else {
      creds = initAuthCreds();
      console.log('📱 Nueva sesión de WhatsApp - se requiere escanear QR');
    }
  } catch (error) {
    console.error('Error cargando sesión:', error);
    creds = initAuthCreds();
  }

  // Función para guardar credenciales
  const saveCreds = async () => {
    try {
      const data = JSON.stringify({ creds, keys }, BufferJSON.replacer);
      
      await (prisma as any).whatsAppSession.upsert({
        where: { sessionId: SESSION_ID },
        update: { data, updatedAt: new Date() },
        create: { sessionId: SESSION_ID, data },
      });
      
      console.log('💾 Sesión de WhatsApp guardada en base de datos');
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
  };

  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
          const data: { [id: string]: SignalDataTypeMap[T] } = {};
          for (const id of ids) {
            const key = `${type}-${id}`;
            if (keys[key]) {
              data[id] = keys[key];
            }
          }
          return data;
        },
        set: async (data: any) => {
          for (const category in data) {
            for (const id in data[category]) {
              const key = `${category}-${id}`;
              if (data[category][id]) {
                keys[key] = data[category][id];
              } else {
                delete keys[key];
              }
            }
          }
          // Guardar después de cada cambio de keys
          await saveCreds();
        },
      },
    },
    saveCreds,
  };
}

/**
 * Elimina la sesión de WhatsApp de la base de datos
 */
export async function clearPostgresAuthState(): Promise<void> {
  try {
    await (prisma as any).whatsAppSession.delete({
      where: { sessionId: SESSION_ID },
    });
    console.log('🗑️ Sesión de WhatsApp eliminada de la base de datos');
  } catch (error) {
    // Ignorar si no existe
    console.log('⚠️ No había sesión para eliminar');
  }
}
