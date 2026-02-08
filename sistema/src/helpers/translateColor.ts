// Mapeo de colores de español a inglés (nombres oficiales de Apple)
const colorTranslations: { [key: string]: string } = {
  // Colores básicos
  'Negro': 'Black',
  'Blanco': 'White',
  'Gris': 'Gray',
  'Dorado': 'Gold',
  'Plata': 'Silver',
  'Oro': 'Gold',
  'Rosa': 'Pink',
  'Rojo': 'Red',
  'Azul': 'Blue',
  'Verde': 'Green',
  'Amarillo': 'Yellow',
  'Morado': 'Purple',
  'Celeste': 'Teal',
  
  // Colores específicos de Apple
  'Negro Espacial': 'Space Black',
  'Gris Espacial': 'Space Gray',
  'Negro Brillante': 'Jet Black',
  'Oro Rosa': 'Rose Gold',
  'Verde Noche': 'Midnight Green',
  'Verde Alpino': 'Alpine Green',
  'Azul Sierra': 'Sierra Blue',
  'Azul Pacífico': 'Pacific Blue',
  'Morado Oscuro': 'Deep Purple',
  'Medianoche': 'Midnight',
  'Blanco Estelar': 'Starlight',
  'Grafito': 'Graphite',
  
  // iPhone 16/17 Titanium
  'Titanio Natural': 'Natural Titanium',
  'Titanio Azul': 'Blue Titanium',
  'Titanio Blanco': 'White Titanium',
  'Titanio Negro': 'Black Titanium',
  'Titanio Desierto': 'Desert Titanium',
  
  // Colores iPhone 16
  'Ultramarino': 'Ultramarine',
  'Coral': 'Coral',
};

/**
 * Traduce un color del español al inglés si es necesario
 * @param color - Color en español o inglés
 * @param locale - Idioma actual ('es' o 'en')
 * @returns Color en el idioma apropiado
 */
export const translateColor = (color: string | undefined | null, locale: string = 'es'): string => {
  if (!color) return '';
  
  // Si el idioma es español, devolver el color tal cual
  if (locale === 'es') return color;
  
  // Si el idioma es inglés, intentar traducir
  // Primero buscar coincidencia exacta
  if (colorTranslations[color]) {
    return colorTranslations[color];
  }
  
  // Buscar coincidencia case-insensitive
  const colorLower = color.toLowerCase();
  const key = Object.keys(colorTranslations).find(
    k => k.toLowerCase() === colorLower
  );
  
  if (key) {
    return colorTranslations[key];
  }
  
  // Si no hay traducción, devolver el color original
  // (probablemente ya está en inglés)
  return color;
};
