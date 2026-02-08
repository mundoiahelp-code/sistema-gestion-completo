const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Aplicando migración de SystemConfig y ActivityLog...');

  try {
    // Verificar si las tablas ya existen
    const systemConfigExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_config'
      );
    `;

    if (systemConfigExists[0].exists) {
      console.log('✅ Las tablas ya existen');
      return;
    }

    // Crear tabla system_config
    await prisma.$executeRaw`
      CREATE TABLE "system_config" (
        "id" TEXT NOT NULL,
        "trialDuration" INTEGER NOT NULL DEFAULT 14,
        "planLimits" JSONB NOT NULL,
        "paymentReminders" JSONB NOT NULL,
        "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
        "paymentConfig" JSONB NOT NULL,
        "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
        "maintenanceMessage" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ Tabla system_config creada');

    // Crear tabla activity_logs
    await prisma.$executeRaw`
      CREATE TABLE "activity_logs" (
        "id" TEXT NOT NULL,
        "tenantId" TEXT NOT NULL,
        "userId" TEXT,
        "action" TEXT NOT NULL,
        "details" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ Tabla activity_logs creada');

    // Crear índices
    await prisma.$executeRaw`CREATE INDEX "activity_logs_tenantId_idx" ON "activity_logs"("tenantId");`;
    await prisma.$executeRaw`CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");`;
    await prisma.$executeRaw`CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");`;
    await prisma.$executeRaw`CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");`;
    console.log('✅ Índices creados');

    // Agregar foreign keys
    await prisma.$executeRaw`
      ALTER TABLE "activity_logs" 
      ADD CONSTRAINT "activity_logs_tenantId_fkey" 
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "activity_logs" 
      ADD CONSTRAINT "activity_logs_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE;
    `;
    console.log('✅ Foreign keys agregadas');

    // Insertar configuración por defecto
    await prisma.$executeRaw`
      INSERT INTO "system_config" (
        "id", 
        "trialDuration", 
        "planLimits", 
        "paymentReminders", 
        "twoFactorEnabled", 
        "paymentConfig", 
        "maintenanceMode",
        "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        14,
        '{"trial": {"users": 2, "stores": 2, "products": 50}, "basic": {"users": 8, "stores": 5, "products": 200}, "pro": {"users": 18, "stores": 10, "products": 1000}}'::jsonb,
        '{"enabled": true, "daysBeforeExpiry": [7, 3, 1], "afterExpiryDays": [1, 3, 7]}'::jsonb,
        false,
        '{"currency": "USD", "taxRate": 0, "invoicePrefix": "INV", "autoInvoice": true}'::jsonb,
        false,
        CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Configuración por defecto insertada');

    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
