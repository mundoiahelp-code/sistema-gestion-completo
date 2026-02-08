export const toTitleCase = (str: string) => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .split('(')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('(')
    .replace(' De ', ' de ')
    .replace(' Del ', ' del ')
    .replace(' Y ', ' y ')
    .replace(' Con ', ' con ');
};
