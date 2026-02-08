const breadcrumbsES: { [key: string]: { name: string; href: string }[] } = {
  '/ajustes/general': [
    { name: 'Ajustes', href: '/ajustes/general' },
    { name: 'General', href: '/ajustes/general' },
  ],
  '/ajustes/seguridad': [
    { name: 'Ajustes', href: '/ajustes/general' },
    { name: 'Seguridad', href: '/ajustes/seguridad' },
  ],
  '/usuarios': [{ name: 'Usuarios', href: '/usuarios' }],
  '/usuarios/agregar': [
    { name: 'Usuarios', href: '/usuarios' },
    { name: 'Agregar', href: '/usuarios/agregar' },
  ],
  '/ingresos': [{ name: 'Ingresos', href: '/ingresos' }],
  '/ingresos/cargar': [
    { name: 'Ingresos', href: '/ingresos' },
    { name: 'Cargar', href: '/ingresos/cargar' },
  ],
  '/productos': [{ name: 'Productos', href: '/productos' }],
  '/clientes': [{ name: 'Clientes', href: '/clientes' }],
  '/clientes/agregar': [
    { name: 'Clientes', href: '/clientes' },
    { name: 'Agregar', href: '/clientes/agregar' },
  ],
  '/ventas': [{ name: 'Ventas', href: '/ventas' }],
  '/ventas/cargar': [
    { name: 'Ventas', href: '/ventas' },
    { name: 'Cargar', href: '/ventas/cargar' },
  ],
  '/ventas/crear': [
    { name: 'Ventas', href: '/ventas' },
    { name: 'Nueva Venta', href: '/ventas/crear' },
  ],
  '/listados': [{ name: 'Listas', href: '/listados' }],
  '/tiendas': [{ name: 'Tiendas', href: '/tiendas' }],
  '/accesorios': [{ name: 'Accesorios', href: '/accesorios' }],
  '/reparaciones': [{ name: 'Técnico', href: '/reparaciones' }],
};

const breadcrumbsEN: { [key: string]: { name: string; href: string }[] } = {
  '/ajustes/general': [
    { name: 'Settings', href: '/ajustes/general' },
    { name: 'General', href: '/ajustes/general' },
  ],
  '/ajustes/seguridad': [
    { name: 'Settings', href: '/ajustes/general' },
    { name: 'Security', href: '/ajustes/seguridad' },
  ],
  '/usuarios': [{ name: 'Users', href: '/usuarios' }],
  '/usuarios/agregar': [
    { name: 'Users', href: '/usuarios' },
    { name: 'Add', href: '/usuarios/agregar' },
  ],
  '/ingresos': [{ name: 'Purchases', href: '/ingresos' }],
  '/ingresos/cargar': [
    { name: 'Purchases', href: '/ingresos' },
    { name: 'Add', href: '/ingresos/cargar' },
  ],
  '/productos': [{ name: 'Products', href: '/productos' }],
  '/clientes': [{ name: 'Customers', href: '/clientes' }],
  '/clientes/agregar': [
    { name: 'Customers', href: '/clientes' },
    { name: 'Add', href: '/clientes/agregar' },
  ],
  '/ventas': [{ name: 'Sales', href: '/ventas' }],
  '/ventas/cargar': [
    { name: 'Sales', href: '/ventas' },
    { name: 'Add', href: '/ventas/cargar' },
  ],
  '/ventas/crear': [
    { name: 'Sales', href: '/ventas' },
    { name: 'New Sale', href: '/ventas/crear' },
  ],
  '/listados': [{ name: 'Lists', href: '/listados' }],
  '/tiendas': [{ name: 'Stores', href: '/tiendas' }],
  '/accesorios': [{ name: 'Accessories', href: '/accesorios' }],
  '/reparaciones': [{ name: 'Repairs', href: '/reparaciones' }],
};

export const getBreadcrumbs = (path: string, locale: string = 'es') => {
  const breadcrumbMap = locale === 'en' ? breadcrumbsEN : breadcrumbsES;
  return breadcrumbMap[path] || [];
};

// Mantener export por compatibilidad
export const breadcrumbs = breadcrumbsES;
