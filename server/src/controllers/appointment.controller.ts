import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { sendWhatsAppNotification } from './notification.controller';

// Schema de validación
const appointmentSchema = z.object({
  date: z.string(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  product: z.string().optional(),
  productId: z.string().optional(),
  storeId: z.string().optional(),
  clientId: z.string().optional(),
  notes: z.string().optional(),
  source: z.enum(['WHATSAPP', 'MANUAL', 'WEB']).optional(),
  paymentMethod: z.string().optional(),
  customerType: z.enum(['MAYORISTA', 'MINORISTA']).optional(),
  assignedUserId: z.string().optional(),
});

// ============================================
// 🎯 FUNCIONES DE VALIDACIÓN ROBUSTAS
// ============================================

// 1. Validar fecha del turno
const validateAppointmentDate = (date: Date): { valid: boolean; reason?: string } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const appointmentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // No permitir fechas pasadas
  if (appointmentDate < today) {
    return {
      valid: false,
      reason: 'No se pueden agendar turnos en fechas pasadas'
    };
  }

  // No permitir más de 60 días en el futuro
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60);
  
  if (appointmentDate > maxDate) {
    return {
      valid: false,
      reason: 'No se pueden agendar turnos con más de 60 días de anticipación'
    };
  }

  return { valid: true };
};

// 2. Validar teléfono argentino
const validatePhone = (phone: string): { valid: boolean; formatted?: string; reason?: string } => {
  // Limpiar número
  let cleaned = phone.replace(/\D/g, '');
  
  // Validar longitud mínima
  if (cleaned.length < 10) {
    return { valid: false, reason: 'Número muy corto (mínimo 10 dígitos)' };
  }

  // Normalizar números argentinos
  if (cleaned.startsWith('15')) {
    // 1512345678 → 5491112345678
    cleaned = '549' + cleaned.substring(2);
  } else if (cleaned.startsWith('11') && cleaned.length === 10) {
    // 1112345678 → 5491112345678
    cleaned = '549' + cleaned;
  } else if (!cleaned.startsWith('54') && cleaned.length === 10) {
    // 1112345678 → 5491112345678
    cleaned = '549' + cleaned;
  } else if (cleaned.startsWith('549') && cleaned.length === 13) {
    // Ya está en formato correcto
  } else if (cleaned.startsWith('54') && cleaned.length === 12) {
    // 541112345678 → 5491112345678 (falta el 9)
    cleaned = '549' + cleaned.substring(2);
  }

  // Validar formato final (debe ser 5491112345678 - 13 dígitos)
  if (cleaned.length < 12 || cleaned.length > 13) {
    return { valid: false, reason: 'Formato inválido (debe ser un número argentino válido)' };
  }

  return { valid: true, formatted: cleaned };
};

// 3. Validar horario de sucursal
const validateStoreHours = async (
  storeId: string, 
  date: Date, 
  time: string
): Promise<{ valid: boolean; reason?: string; storeHours?: { open: string; close: string }; appointmentDuration?: number }> => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      name: true,
      mondayHours: true,
      tuesdayHours: true,
      wednesdayHours: true,
      thursdayHours: true,
      fridayHours: true,
      saturdayHours: true,
      sundayHours: true,
      appointmentDuration: true
    }
  });

  if (!store) {
    return { valid: false, reason: 'Sucursal no encontrada' };
  }

  // Obtener día de la semana (0 = domingo, 6 = sábado)
  const dayOfWeek = date.getDay();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayHours = [
    store.sundayHours,
    store.mondayHours,
    store.tuesdayHours,
    store.wednesdayHours,
    store.thursdayHours,
    store.fridayHours,
    store.saturdayHours
  ][dayOfWeek];

  // Si no hay horario configurado o está cerrado
  if (!dayHours || dayHours.toLowerCase() === 'cerrado' || dayHours.trim() === '') {
    return {
      valid: false,
      reason: `La sucursal ${store.name} está cerrada los ${dayNames[dayOfWeek]}s`
    };
  }

  // Parsear horario (formato: "09:00-19:00" o "09:00 - 19:00")
  const hoursParts = dayHours.split('-').map(t => t.trim());
  if (hoursParts.length !== 2) {
    console.error(`⚠️ Formato de horario inválido para ${dayNames[dayOfWeek]}: ${dayHours}`);
    return {
      valid: false,
      reason: 'Horario de sucursal mal configurado. Contactá al administrador.'
    };
  }

  const [openTime, closeTime] = hoursParts;
  
  // Validar que el turno esté dentro del horario
  if (time < openTime || time >= closeTime) {
    return {
      valid: false,
      reason: `Fuera del horario de atención (${openTime} a ${closeTime})`,
      storeHours: { open: openTime, close: closeTime }
    };
  }

  return { 
    valid: true, 
    appointmentDuration: store.appointmentDuration || 15,
    storeHours: { open: openTime, close: closeTime }
  };
};

// 4. Generar slots disponibles según configuración de sucursal
const generateAvailableSlots = async (
  tenantId: string,
  storeId: string,
  date: Date
): Promise<string[]> => {
  // 1. Obtener configuración de la sucursal
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      mondayHours: true,
      tuesdayHours: true,
      wednesdayHours: true,
      thursdayHours: true,
      fridayHours: true,
      saturdayHours: true,
      sundayHours: true,
      appointmentDuration: true
    }
  });

  if (!store) return [];

  // 2. Obtener horario del día
  const dayOfWeek = date.getDay();
  const dayHours = [
    store.sundayHours,
    store.mondayHours,
    store.tuesdayHours,
    store.wednesdayHours,
    store.thursdayHours,
    store.fridayHours,
    store.saturdayHours
  ][dayOfWeek];

  if (!dayHours || dayHours.toLowerCase() === 'cerrado' || dayHours.trim() === '') return [];

  const hoursParts = dayHours.split('-').map(t => t.trim());
  if (hoursParts.length !== 2) return [];

  const [openTime, closeTime] = hoursParts;
  const duration = store.appointmentDuration || 15;

  // 3. Generar todos los slots posibles
  const allSlots: string[] = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  let currentMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  while (currentMinutes + duration <= closeMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    allSlots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
    currentMinutes += duration;
  }

  // 4. Obtener turnos ya agendados
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      storeId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { not: 'CANCELLED' }
    },
    select: { time: true }
  });

  const bookedTimes = new Set(bookedAppointments.map(a => a.time));

  // 5. Filtrar slots disponibles
  const availableSlots = allSlots.filter(slot => !bookedTimes.has(slot));

  return availableSlots;
};

// 5. Validar si se puede modificar/cancelar un turno
const canModifyAppointment = (appointment: any): { can: boolean; reason?: string } => {
  const now = new Date();
  const appointmentDateTime = new Date(appointment.date);
  const [hours, minutes] = appointment.time.split(':').map(Number);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  // Calcular diferencia en horas
  const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // No permitir modificar/cancelar con menos de 2 horas de anticipación
  if (diffHours < 2 && diffHours >= 0) {
    return {
      can: false,
      reason: 'No se puede modificar/cancelar con menos de 2 horas de anticipación. Contactá al local.'
    };
  }

  // No permitir modificar turnos pasados
  if (diffHours < 0) {
    return {
      can: false,
      reason: 'No se pueden modificar turnos pasados'
    };
  }

  return { can: true };
};

// 6. Crear turno de forma segura (con transacción para prevenir race conditions)
const createAppointmentSafe = async (data: any) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Verificar disponibilidad con lock
    const existing = await tx.appointment.findFirst({
      where: {
        tenantId: data.tenantId,
        date: data.date,
        time: data.time,
        status: { not: 'CANCELLED' },
        ...(data.storeId && { storeId: data.storeId })
      }
    });

    if (existing) {
      throw new Error('SLOT_TAKEN');
    }

    // 2. Crear turno
    const appointment = await tx.appointment.create({
      data: data,
      include: {
        store: true,
        client: true,
      }
    });

    // 3. Reservar producto si existe
    if (data.productId) {
      await tx.product.update({
        where: { id: data.productId },
        data: { reserved: 1 }
      });
      console.log(`📦 Producto reservado: ${data.productId}`);
    }

    return appointment;
  }, {
    timeout: 10000 // 10 segundos timeout
  });
};

// Obtener todos los turnos
export const getAppointments = async (req: Request, res: Response) => {
  try {
    const { date, status, storeId, page = '1', limit = '50' } = req.query;
    const tenantId = req.user?.tenantId;

    const where: any = { tenantId };

    if (date) {
      // Crear fechas en UTC para evitar problemas de timezone
      const startDate = new Date(date as string + 'T00:00:00.000Z');
      const endDate = new Date(date as string + 'T23:59:59.999Z');
      where.date = { gte: startDate, lte: endDate };
    }

    if (status) where.status = status;
    if (storeId) where.storeId = storeId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          store: true,
          client: true,
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
        skip,
        take: parseInt(limit as string),
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({
      appointments,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
};

// Obtener turno por ID
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        store: true,
        client: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error al obtener turno:', error);
    res.status(500).json({ error: 'Error al obtener turno' });
  }
};

// Helper: Generar slots de tiempo disponibles
const generateTimeSlots = (startHour: number, endHour: number, duration: number = 15): string[] => {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += duration) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

// Helper: Encontrar horarios alternativos cercanos
const findAlternativeSlots = async (
  tenantId: string,
  date: Date,
  requestedTime: string,
  storeId?: string,
  duration: number = 15
): Promise<string[]> => {
  // Obtener todos los turnos del día
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { not: 'CANCELLED' },
      ...(storeId && { storeId }),
    },
    select: { time: true },
  });

  const occupiedTimes = new Set(existingAppointments.map(a => a.time));
  
  // Generar todos los slots del día (9:00 a 20:00 por defecto)
  const allSlots = generateTimeSlots(9, 20, duration);
  const availableSlots = allSlots.filter(slot => !occupiedTimes.has(slot));
  
  // Encontrar los 2 más cercanos al horario solicitado
  const requestedMinutes = parseInt(requestedTime.split(':')[0]) * 60 + parseInt(requestedTime.split(':')[1]);
  
  const sortedByDistance = availableSlots
    .map(slot => {
      const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
      return { slot, distance: Math.abs(slotMinutes - requestedMinutes) };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2)
    .map(s => s.slot);

  return sortedByDistance;
};

// Crear turno con validaciones robustas
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const validatedData = appointmentSchema.parse(req.body);
    const forceCreate = req.body.forceCreate === true;

    // Convertir fecha string a Date
    const appointmentDate = new Date(validatedData.date + 'T12:00:00.000Z');

    // ============================================
    // 🎯 VALIDACIONES ROBUSTAS
    // ============================================

    // 1. Validar fecha (no pasada, no más de 60 días)
    const dateValidation = validateAppointmentDate(appointmentDate);
    if (!dateValidation.valid) {
      console.log(`❌ Fecha inválida: ${dateValidation.reason}`);
      return res.status(400).json({ error: dateValidation.reason });
    }

    // 2. Validar y normalizar teléfono
    const phoneValidation = validatePhone(validatedData.customerPhone);
    if (!phoneValidation.valid) {
      console.log(`❌ Teléfono inválido: ${phoneValidation.reason}`);
      return res.status(400).json({ 
        error: `Teléfono inválido: ${phoneValidation.reason}`,
        phone: validatedData.customerPhone
      });
    }
    const normalizedPhone = phoneValidation.formatted!;

    // 3. Validar horario de sucursal (si se especificó)
    let appointmentDuration = 15;
    if (validatedData.storeId) {
      const storeValidation = await validateStoreHours(
        validatedData.storeId,
        appointmentDate,
        validatedData.time
      );
      
      if (!storeValidation.valid) {
        console.log(`❌ Horario inválido: ${storeValidation.reason}`);
        
        // Si está fuera de horario, sugerir slots disponibles
        if (storeValidation.storeHours) {
          const availableSlots = await generateAvailableSlots(
            tenantId!,
            validatedData.storeId,
            appointmentDate
          );
          
          return res.status(400).json({ 
            error: storeValidation.reason,
            storeHours: storeValidation.storeHours,
            availableSlots: availableSlots.slice(0, 5) // Primeros 5 slots
          });
        }
        
        return res.status(400).json({ error: storeValidation.reason });
      }
      
      appointmentDuration = storeValidation.appointmentDuration || 15;
    }

    // 4. Verificar conflicto de horario (si no es forzado)
    if (!forceCreate) {
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          tenantId,
          date: appointmentDate,
          time: validatedData.time,
          status: { not: 'CANCELLED' },
          ...(validatedData.storeId && { storeId: validatedData.storeId }),
        },
      });

      if (existingAppointment) {
        console.log(`⚠️ Conflicto de horario detectado: ${validatedData.date} ${validatedData.time}`);
        
        // Buscar horarios alternativos
        const alternatives = validatedData.storeId 
          ? await generateAvailableSlots(tenantId!, validatedData.storeId, appointmentDate)
          : [];

        return res.status(409).json({ 
          error: 'Ya existe un turno en ese horario',
          conflictingAppointment: existingAppointment,
          alternativeSlots: alternatives.slice(0, 5),
          canForce: true,
        });
      }
    }

    // ============================================
    // 📦 BUSCAR/RESERVAR PRODUCTO
    // ============================================
    let productId = validatedData.productId;
    if (!productId && validatedData.product) {
      const productName = validatedData.product.replace(/\s*x\d+$/, '').trim();
      
      let product = await prisma.product.findFirst({
        where: {
          tenantId,
          active: true,
          stock: { gt: 0 },
          reserved: 0,
          OR: [
            { name: productName },
            { model: productName },
            { name: { contains: productName } },
            { model: { contains: productName } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!product) {
        const parts = productName.split(' ').filter(p => p.length > 2);
        if (parts.length > 0) {
          product = await prisma.product.findFirst({
            where: {
              tenantId,
              active: true,
              stock: { gt: 0 },
              reserved: 0,
              AND: parts.map(part => ({
                OR: [
                  { name: { contains: part } },
                  { model: { contains: part } },
                  { storage: { contains: part } },
                ]
              }))
            },
            orderBy: { createdAt: 'desc' },
          });
        }
      }

      if (product) {
        productId = product.id;
        console.log(`📦 Producto encontrado para reservar: ${product.name || product.model} (${product.id})`);
      } else {
        console.log(`⚠️ No se encontró producto disponible para: ${productName}`);
      }
    }

    // ============================================
    // 👤 BUSCAR/CREAR CLIENTE
    // ============================================
    let clientId = validatedData.clientId;
    if (!clientId && normalizedPhone) {
      const existingClient = await prisma.client.findFirst({
        where: {
          tenantId,
          phone: normalizedPhone,
        },
      });

      if (existingClient) {
        clientId = existingClient.id;
        console.log(`👤 Cliente existente encontrado: ${existingClient.name} (${existingClient.id})`);
      } else {
        const newClient = await prisma.client.create({
          data: {
            name: validatedData.customerName,
            phone: normalizedPhone,
            tenantId,
          },
        });
        clientId = newClient.id;
        console.log(`👤 Nuevo cliente creado: ${newClient.name} (${newClient.id})`);
      }
    }

    // ============================================
    // ✅ CREAR TURNO DE FORMA SEGURA (con transacción)
    // ============================================
    const appointment = await createAppointmentSafe({
      ...validatedData,
      date: appointmentDate,
      tenantId,
      clientId,
      productId,
      customerPhone: normalizedPhone,
      source: validatedData.source || 'MANUAL',
    });

    console.log(`📅 Turno creado exitosamente: ${appointment.id} - ${validatedData.customerName} - ${validatedData.date} ${validatedData.time}`);

    // ============================================
    // 📱 ENVIAR NOTIFICACIÓN
    // ============================================
    if (tenantId) {
      const dateStr = appointmentDate.toLocaleDateString('es-AR');
      const source = validatedData.source === 'WHATSAPP' ? '🤖 Bot' : '✍️ Manual';
      const message = `📅 *Nuevo turno agendado*\n\n` +
        `👤 Cliente: ${validatedData.customerName}\n` +
        `📱 Tel: ${normalizedPhone}\n` +
        `📆 Fecha: ${dateStr}\n` +
        `🕐 Hora: ${validatedData.time}\n` +
        `📝 Motivo: ${validatedData.product || 'No especificado'}\n` +
        `📍 Origen: ${source}`;
      
      sendWhatsAppNotification(tenantId, message, 'appointmentNew');
    }

    res.status(201).json(appointment);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    
    if (error.message === 'SLOT_TAKEN') {
      console.log(`⚠️ Race condition detectada: slot tomado por otro proceso`);
      return res.status(409).json({
        error: 'Ese horario acaba de ser tomado por otro cliente'
      });
    }
    
    console.error('❌ Error al crear turno:', error);
    res.status(500).json({ error: 'Error al crear turno' });
  }
};

// Actualizar turno con validaciones
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const validatedData = appointmentSchema.partial().parse(req.body);

    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    // ============================================
    // 🎯 VALIDAR SI SE PUEDE MODIFICAR
    // ============================================
    const modifyValidation = canModifyAppointment(appointment);
    if (!modifyValidation.can) {
      console.log(`❌ No se puede modificar turno: ${modifyValidation.reason}`);
      return res.status(400).json({ error: modifyValidation.reason });
    }

    // ============================================
    // 🎯 VALIDACIONES SI CAMBIA FECHA/HORA
    // ============================================
    if (validatedData.date || validatedData.time) {
      const checkDate = validatedData.date 
        ? new Date(validatedData.date + 'T12:00:00.000Z') 
        : appointment.date;
      const checkTime = validatedData.time || appointment.time;

      // Validar nueva fecha
      if (validatedData.date) {
        const dateValidation = validateAppointmentDate(checkDate);
        if (!dateValidation.valid) {
          console.log(`❌ Nueva fecha inválida: ${dateValidation.reason}`);
          return res.status(400).json({ error: dateValidation.reason });
        }
      }

      // Validar horario de sucursal
      if (appointment.storeId) {
        const storeValidation = await validateStoreHours(
          appointment.storeId,
          checkDate,
          checkTime
        );
        
        if (!storeValidation.valid) {
          console.log(`❌ Nuevo horario inválido: ${storeValidation.reason}`);
          
          if (storeValidation.storeHours) {
            const availableSlots = await generateAvailableSlots(
              tenantId!,
              appointment.storeId,
              checkDate
            );
            
            return res.status(400).json({ 
              error: storeValidation.reason,
              storeHours: storeValidation.storeHours,
              availableSlots: availableSlots.slice(0, 5)
            });
          }
          
          return res.status(400).json({ error: storeValidation.reason });
        }
      }

      // Verificar conflictos con otros turnos
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          tenantId,
          date: checkDate,
          time: checkTime,
          status: { not: 'CANCELLED' },
          id: { not: id },
          ...(appointment.storeId && { storeId: appointment.storeId }),
        },
      });

      if (conflictingAppointment) {
        console.log(`⚠️ Conflicto al modificar: ${checkDate.toISOString()} ${checkTime}`);
        
        const alternatives = appointment.storeId
          ? await generateAvailableSlots(tenantId!, appointment.storeId, checkDate)
          : [];
        
        return res.status(400).json({ 
          error: 'Ya existe un turno en ese horario',
          conflictingAppointment,
          alternativeSlots: alternatives.slice(0, 5)
        });
      }
    }

    // ============================================
    // 🎯 VALIDAR TELÉFONO SI SE MODIFICA
    // ============================================
    if (validatedData.customerPhone) {
      const phoneValidation = validatePhone(validatedData.customerPhone);
      if (!phoneValidation.valid) {
        console.log(`❌ Teléfono inválido: ${phoneValidation.reason}`);
        return res.status(400).json({ 
          error: `Teléfono inválido: ${phoneValidation.reason}` 
        });
      }
      validatedData.customerPhone = phoneValidation.formatted;
    }

    // ============================================
    // ✅ ACTUALIZAR TURNO
    // ============================================
    const updateData: any = { ...validatedData };
    if (validatedData.date) {
      updateData.date = new Date(validatedData.date + 'T12:00:00.000Z');
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        store: true,
        client: true,
      },
    });

    console.log(`📅 Turno modificado: ${id} - ${updatedAppointment.customerName}`);

    // ============================================
    // 📱 ENVIAR NOTIFICACIÓN SI CAMBIÓ FECHA/HORA
    // ============================================
    if ((validatedData.date || validatedData.time) && updatedAppointment.customerPhone) {
      try {
        const { whatsappService } = await import('../services/whatsapp.service');
        const { chatbotService } = await import('../services/chatbot.service');
        
        const fechaStr = new Date(updatedAppointment.date).toLocaleDateString('es-AR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        });
        
        const mensaje = `hola! te aviso que se modificó tu turno. la nueva fecha es ${fechaStr} a las ${updatedAppointment.time}hs. cualquier cosa avisame`;
        
        await whatsappService.sendMessage(updatedAppointment.customerPhone, mensaje, tenantId);
        chatbotService.addSystemMessage(updatedAppointment.customerPhone, mensaje);
        
        console.log(`📱 Notificación de modificación enviada a ${updatedAppointment.customerPhone}`);
      } catch (error) {
        console.error('Error enviando notificación de modificación:', error);
      }
    }

    res.json(updatedAppointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('❌ Error al actualizar turno:', error);
    res.status(500).json({ error: 'Error al actualizar turno' });
  }
};

// Eliminar turno
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    // Liberar producto reservado si existe
    if (appointment.productId) {
      try {
        // Verificar si el producto existe antes de actualizarlo
        const product = await prisma.product.findUnique({
          where: { id: appointment.productId },
        });

        if (product) {
          await prisma.product.update({
            where: { id: appointment.productId },
            data: { reserved: 0 },
          });
          console.log(`📦 Producto liberado al eliminar turno: ${appointment.productId}`);
        } else {
          console.log(`⚠️ Producto ${appointment.productId} no existe, continuando con eliminación del turno`);
        }
      } catch (productError) {
        console.error('Error al liberar producto, continuando con eliminación:', productError);
      }
    }

    await prisma.appointment.delete({ where: { id } });

    res.json({ message: 'Turno eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar turno:', error);
    res.status(500).json({ error: 'Error al eliminar turno' });
  }
};

// Obtener slots disponibles para una fecha y sucursal
export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { date, storeId } = req.query;
    const tenantId = req.user?.tenantId;

    if (!date || !storeId) {
      return res.status(400).json({ error: 'Fecha y sucursal son requeridos' });
    }

    const appointmentDate = new Date(date as string + 'T12:00:00.000Z');

    // Validar fecha
    const dateValidation = validateAppointmentDate(appointmentDate);
    if (!dateValidation.valid) {
      return res.status(400).json({ error: dateValidation.reason });
    }

    // Validar que la sucursal esté abierta ese día
    const storeValidation = await validateStoreHours(
      storeId as string,
      appointmentDate,
      '00:00' // Solo para verificar si está abierto
    );

    if (!storeValidation.valid && !storeValidation.storeHours) {
      // Está cerrado ese día
      return res.json({ 
        available: false,
        reason: storeValidation.reason,
        slots: []
      });
    }

    // Generar slots disponibles
    const slots = await generateAvailableSlots(
      tenantId!,
      storeId as string,
      appointmentDate
    );

    res.json({
      available: slots.length > 0,
      date: date,
      storeId: storeId,
      storeHours: storeValidation.storeHours,
      appointmentDuration: storeValidation.appointmentDuration || 15,
      slots: slots,
      totalSlots: slots.length
    });

  } catch (error) {
    console.error('❌ Error al obtener slots disponibles:', error);
    res.status(500).json({ error: 'Error al obtener horarios disponibles' });
  }
};

// Obtener turnos de hoy
export const getTodayAppointments = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        store: true,
        client: true,
      },
      orderBy: { time: 'asc' },
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error al obtener turnos de hoy:', error);
    res.status(500).json({ error: 'Error al obtener turnos de hoy' });
  }
};

// Cambiar estado del turno
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, message: customMessage, newDate, newTime, assignedUserId } = req.body;
    const tenantId = req.user?.tenantId;

    console.log(`🔄 updateAppointmentStatus - ID: ${id}`);
    console.log(`📋 Body recibido:`, { status, customMessage, newDate, newTime, assignedUserId });

    if (!['CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId },
      include: { store: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    // PROTECCIÓN: Si ya está en el estado solicitado, no hacer nada
    if (appointment.status === status) {
      return res.json({ 
        appointment, 
        message: 'El turno ya está en este estado',
        alreadyProcessed: true 
      });
    }

    // Si se cancela o no vino, liberar el producto reservado
    if ((status === 'CANCELLED' || status === 'NO_SHOW') && appointment.productId) {
      await prisma.product.update({
        where: { id: appointment.productId },
        data: { reserved: 0 }
      });
      console.log(`📦 Producto liberado (${status}): ${appointment.productId}`);
    }
    
    // Si se marca como COMPLETADO (atendido), crear la venta y descontar stock
    if (status === 'COMPLETED' && appointment.productId) {
      const product = await prisma.product.findUnique({
        where: { id: appointment.productId }
      });
      
      if (product) {
        // Obtener precio de venta (puede ser modificado desde el frontend)
        const { salePrice, paymentMethod: reqPaymentMethod } = req.body;
        const finalSalePrice = salePrice || product.price;
        const finalPaymentMethod = reqPaymentMethod || appointment.paymentMethod || 'CASH';
        
        // Crear la venta
        const sale = await prisma.sale.create({
          data: {
            total: finalSalePrice,
            paymentMethod: finalPaymentMethod,
            saleType: appointment.customerType === 'MAYORISTA' ? 'WHOLESALE' : 'RETAIL',
            notes: `Venta desde turno - ${appointment.customerName}`,
            tenantId: tenantId!,
            userId: assignedUserId || req.user!.id,
            storeId: appointment.storeId || product.storeId,
            clientId: appointment.clientId || undefined,
            items: {
              create: {
                productId: product.id,
                quantity: 1,
                price: finalSalePrice,
                subtotal: finalSalePrice,
              }
            }
          }
        });
        
        // Descontar stock del producto
        if (product.category === 'PHONE') {
          // Para celulares, marcar como inactivo (vendido)
          await prisma.product.update({
            where: { id: product.id },
            data: { active: false, reserved: 0, stock: 0 }
          });
        } else {
          // Para accesorios, descontar stock
          await prisma.product.update({
            where: { id: product.id },
            data: { 
              stock: Math.max(0, product.stock - 1),
              reserved: Math.max(0, product.reserved - 1)
            }
          });
        }
        
        console.log(`💰 Venta creada desde turno: ${sale.id} - Producto: ${product.name || product.model} - Precio: $${salePrice}`);
      }
    }

    // Preparar datos de actualización
    const updateData: any = { status };
    
    // Si es modificación de fecha/hora
    if (newDate) {
      updateData.date = new Date(newDate + 'T12:00:00.000Z');
    }
    if (newTime) {
      updateData.time = newTime;
    }
    
    // Si se marca como completado, guardar quién atendió
    if (assignedUserId) {
      updateData.assignedUserId = assignedUserId;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        store: true,
        client: true,
      },
    });

    // Enviar mensaje al cliente por WhatsApp (usando el servicio del server)
    const { whatsappService } = await import('../services/whatsapp.service');
    const customerPhone = appointment.customerPhone;
    
    console.log(`📱 Notificación WhatsApp - Status: ${status}, Teléfono: ${customerPhone}`);
    console.log(`📱 Datos recibidos - newDate: ${newDate}, newTime: ${newTime}, message: ${customMessage}`);

    // Importar chatbot service para agregar contexto
    const { chatbotService } = await import('../services/chatbot.service');

    // Obtener nombre del tenant
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const tenantName = tenant?.name || 'nuestro local';

    if (status === 'CANCELLED') {
      // Mensaje de cancelación
      const cancelMessage = customMessage || `Hola! Te escribimos de ${tenantName}. Lamentablemente tuvimos que cancelar tu turno. Disculpá las molestias, cualquier cosa escribinos para reagendar.`;
      console.log(`📤 Enviando mensaje de cancelación a ${customerPhone}...`);
      console.log(`📝 Mensaje: ${cancelMessage}`);
      const sent = await whatsappService.sendMessage(customerPhone, cancelMessage);
      if (sent) {
        console.log(`✅ Mensaje de cancelación enviado a ${customerPhone}`);
        // Agregar al contexto del bot para que sepa que envió este mensaje
        chatbotService.addSystemMessage(customerPhone, cancelMessage);
      } else {
        console.error(`❌ Error enviando mensaje de cancelación a ${customerPhone}`);
      }
    } else if (newDate || newTime) {
      // Mensaje de modificación
      const fechaStr = newDate ? new Date(newDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
      const horaStr = newTime || appointment.time;
      const modifyMessage = customMessage || `Hola! Te escribimos de ${tenantName}. Te queríamos avisar que tu turno fue modificado para el ${fechaStr} a las ${horaStr}hs. Disculpá las molestias, te esperamos!`;
      console.log(`📤 Enviando mensaje de modificación a ${customerPhone}...`);
      console.log(`📝 Mensaje: ${modifyMessage}`);
      const sent = await whatsappService.sendMessage(customerPhone, modifyMessage);
      if (sent) {
        console.log(`✅ Mensaje de modificación enviado a ${customerPhone}`);
        // Agregar al contexto del bot para que sepa que envió este mensaje
        chatbotService.addSystemMessage(customerPhone, modifyMessage);
      } else {
        console.error(`❌ Error enviando mensaje de modificación a ${customerPhone}`);
      }
    }

    // Notificación interna
    if (status === 'CANCELLED' && tenantId) {
      const dateStr = new Date(appointment.date).toLocaleDateString('es-AR');
      const message = `❌ *Turno cancelado*\n\n` +
        `👤 Cliente: ${appointment.customerName}\n` +
        `📆 Fecha: ${dateStr}\n` +
        `🕐 Hora: ${appointment.time}`;
      
      sendWhatsAppNotification(tenantId, message, 'appointmentCancelled');
    }

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};
