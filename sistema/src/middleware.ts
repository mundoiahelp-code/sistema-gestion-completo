import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que NO requieren autenticación
const publicRoutes = [
  '/iniciar-sesion', 
  '/registro', 
  '/recuperar-password', 
  '/olvide-password',
  '/restablecer-password',
  '/verificar-codigo',
  '/activar', 
  '/planes', 
  '/landing',
  '/verificar-email'
];

// Rutas de API que no necesitan verificación en middleware
const apiRoutes = ['/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar archivos estáticos y API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // archivos estáticos (.ico, .png, etc)
  ) {
    return NextResponse.next();
  }

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar si hay token en las cookies
  const token = request.cookies.get('accessToken')?.value;

  // Si no hay token, redirigir al login
  if (!token) {
    const loginUrl = new URL('/iniciar-sesion', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar que el token no esté expirado (decodificar JWT básico)
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    
    // Si el token expiró, redirigir al login
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const response = NextResponse.redirect(new URL('/iniciar-sesion', request.url));
      // Limpiar la cookie expirada
      response.cookies.delete('accessToken');
      return response;
    }
  } catch (e) {
    // Token inválido, redirigir al login
    const response = NextResponse.redirect(new URL('/iniciar-sesion', request.url));
    response.cookies.delete('accessToken');
    return response;
  }

  // Token válido, permitir acceso
  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
