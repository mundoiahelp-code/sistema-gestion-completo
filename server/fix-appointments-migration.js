/**
 * Script para aplicar manualmente la migración de appointments
 * Esto es necesario porque la migración falló a medias
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Aplicando fix de migración de appointments...\n');

  try {
    // Verificar si las columnas ya existen
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' 
      AND column_name IN ('cancelReason', 'attendedAt', 'cancelledAt')
    `;

    console.log('Columnas existentes:', result);

    if (result.length === 3) {
      console.log('✅ Las columnas ya existen. No es necesario aplicar el fix.');
      return;
    }

    console.log('📝 Aplicando ALTER TABLE para agregar columnas faltantes...');

    // Aplicar el SQL de la migración
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "appointments" 
      ADD COLUMN IF NOT EXISTS "attendedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "cancelReason" TEXT,
      ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
    `);

    console.log('✅ Columnas agregadas correctamente');

    // Crear índices si no existen
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON "appointments"("status");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "appointments_tenantId_status_idx" ON "appointments"("tenantId", "status");
    `);

    console.log('✅ Índices creados correctamente');
    console.log('\n🎉 Fix aplicado exitosamente!');

  } catch (error) {
    console.error('❌ Error aplicando fix:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
