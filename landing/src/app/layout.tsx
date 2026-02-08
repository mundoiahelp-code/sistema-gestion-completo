import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Clodeb - Sistema de Gestión con IA',
  description: 'El sistema de gestión definitivo para tu negocio de tecnología. Inventario, ventas, WhatsApp con IA y más.',
  icons: {
    icon: '/screenshots/logo.png',
    apple: '/screenshots/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
