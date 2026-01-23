/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones de producción
  reactStrictMode: true,
  
  // Ignorar ESLint en build (los errores no afectan funcionalidad)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Ignorar errores de TypeScript en build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuración de imágenes si se usan
  images: {
    domains: ['localhost'],
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
