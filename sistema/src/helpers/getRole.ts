export const getRole = (role: string) => {
  const roles: Record<string, string> = {
    // Backend roles
    'ADMIN': 'Admin',
    'SELLER': 'Usuario',
    'EMPLOYEE': 'Usuario',
    'USER': 'Usuario',
    // Legacy roles (por compatibilidad)
    'admin': 'Admin',
    'vendor': 'Usuario',
    'seller': 'Usuario',
    'employee': 'Usuario',
  };

  return roles[role] || 'Usuario';
};
