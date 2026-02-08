import { IPhone } from '@/interfaces/schemas.interfaces';

// Copiar Stock - Stock completo agrupado por modelo+storage con colores, batería y precio
export const copyStockMsg = (data: IPhone[], locale: string = 'es') => {
  const available = data.filter((phone) => !phone.reserved);

  if (available.length === 0) {
    return locale === 'en' ? 'No stock available' : 'No hay stock disponible';
  }

  const groupKey = (p: IPhone) => `${p.model}|${p.storage}`;
  const groupMap = new Map<string, IPhone[]>();

  available.forEach((phone) => {
    const key = groupKey(phone);
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(phone);
  });

  let message = locale === 'en' 
    ? '⚡️*AVAILABLE STOCK - IMMEDIATE DELIVERY*⚡️\n*SHIPPING NATIONWIDE*\n\n'
    : '⚡️*STOCK DISPONIBLE ENTREGA INMEDIATA*⚡️\n*ENVIOS A TODO EL PAIS*\n\n';

  const sortedGroups = Array.from(groupMap.entries()).sort((a, b) => {
    const modelA = a[1][0].model;
    const modelB = b[1][0].model;
    return modelA.localeCompare(modelB);
  });

  sortedGroups.forEach(([_, phones]) => {
    const first = phones[0];
    const batteries = phones.map((p) => p.battery).filter((b) => b != null).sort((a, b) => a - b);
    const prices = phones.map((p) => p.price).filter((p) => p != null).sort((a, b) => a - b);
    const colors = [...new Set(phones.map((p) => p.color?.toLowerCase()).filter(Boolean))];

    let line = `· ${first.model} ${first.storage}`;

    if (batteries.length > 0) {
      if (batteries[0] === batteries[batteries.length - 1]) {
        line += ` ${batteries[0]}%`;
      } else {
        line += locale === 'en' 
          ? ` ${batteries[0]}% to ${batteries[batteries.length - 1]}%`
          : ` ${batteries[0]}% a ${batteries[batteries.length - 1]}%`;
      }
    }

    if (colors.length > 0) {
      line += ` (${colors.join('/')})`;
    }

    message += line + '\n';

    if (prices.length > 0) {
      if (prices[0] === prices[prices.length - 1]) {
        message += `*${prices[0]} U$*\n`;
      } else {
        message += locale === 'en'
          ? `*${prices[0]} to ${prices[prices.length - 1]} U$*\n`
          : `*${prices[0]} a ${prices[prices.length - 1]} U$*\n`;
      }
    }

    message += '\n';
  });

  return message.trim();
};

// Copiar Modelos - Solo lista de modelos con GB disponibles
export const copyModelsStock = (data: IPhone[], locale: string = 'es') => {
  const available = data.filter((phone) => !phone.reserved);

  if (available.length === 0) {
    return locale === 'en' ? 'No stock available' : 'No hay stock disponible';
  }

  const modelMap = new Map<string, Set<string>>();

  available.forEach((phone) => {
    const model = phone.model;
    if (!modelMap.has(model)) {
      modelMap.set(model, new Set());
    }
    modelMap.get(model)!.add(phone.storage);
  });

  let message = locale === 'en' ? '*AVAILABLE MODELS*\n\n' : '*MODELOS DISPONIBLES*\n\n';

  modelMap.forEach((storages, model) => {
    const storageList = Array.from(storages).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    }).join('/');
    message += `· ${model} ${storageList}\n`;
  });

  return message;
};
