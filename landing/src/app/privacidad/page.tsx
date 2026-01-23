'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Database, Users, FileText } from 'lucide-react';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Volver al inicio</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Política de Privacidad
          </h1>
        </div>
        
        <p className="text-gray-600 mb-12">
          Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {/* Intro */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-12">
          <p className="text-gray-700 leading-relaxed">
            En MundoIAple, nos tomamos muy en serio la privacidad y seguridad de sus datos. 
            Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos 
            su información personal cuando utiliza nuestro servicio.
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          {/* 1. Información que Recopilamos */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900 m-0">1. Información que Recopilamos</h2>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1.1 Información de Registro</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cuando crea una cuenta, recopilamos:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono (opcional)</li>
              <li>Nombre de la empresa o negocio</li>
              <li>Contraseña (encriptada)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1.2 Información de Uso</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Durante el uso del servicio, recopilamos:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>Datos de productos, inventario y ventas que usted ingresa</li>
              <li>Información de clientes que gestiona en el CRM</li>
              <li>Registros de actividad y transacciones</li>
              <li>Conversaciones con el asistente de IA</li>
              <li>Configuraciones y preferencias del sistema</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1.3 Información Técnica</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Automáticamente recopilamos:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Dirección IP</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Sistema operativo</li>
              <li>Páginas visitadas y tiempo de uso</li>
              <li>Cookies y tecnologías similares</li>
            </ul>
          </section>

          {/* 2. Cómo Usamos su Información */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900 m-0">2. Cómo Usamos su Información</h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              Utilizamos su información para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Proveer el Servicio:</strong> Gestionar su cuenta y proporcionar las funcionalidades contratadas</li>
              <li><strong>Procesamiento de Pagos:</strong> Facturar y procesar sus pagos de manera segura</li>
              <li><strong>Comunicación:</strong> Enviar notificaciones importantes, actualizaciones y soporte técnico</li>
              <li><strong>Mejora del Servicio:</strong> Analizar el uso para mejorar funcionalidades y experiencia</li>
              <li><strong>Seguridad:</strong> Detectar y prevenir fraudes, abusos y actividades maliciosas</li>
              <li><strong>Cumplimiento Legal:</strong> Cumplir con obligaciones legales y regulatorias</li>
              <li><strong>Marketing:</strong> Enviar información sobre nuevas funcionalidades (puede darse de baja en cualquier momento)</li>
            </ul>
          </section>

          {/* 3. Compartir Información */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900 m-0">3. Compartir su Información</h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>NO vendemos ni alquilamos sus datos personales a terceros.</strong>
            </p>
            
            <p className="text-gray-700 leading-relaxed mb-4">
              Podemos compartir información limitada con:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Proveedores de Servicios</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li><strong>Procesadores de Pago:</strong> MercadoPago, Binance (solo datos necesarios para transacciones)</li>
              <li><strong>Hosting:</strong> Proveedores de infraestructura cloud para almacenar datos de forma segura</li>
              <li><strong>Servicios de IA:</strong> Proveedores de modelos de lenguaje para el asistente virtual</li>
              <li><strong>Análisis:</strong> Herramientas de análisis para mejorar el servicio (datos anonimizados)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Requisitos Legales</h3>
            <p className="text-gray-700 leading-relaxed">
              Podemos divulgar información si es requerido por ley, orden judicial, o para proteger 
              nuestros derechos legales y la seguridad de nuestros usuarios.
            </p>
          </section>

          {/* 4. Seguridad de Datos */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900 m-0">4. Seguridad de sus Datos</h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              Implementamos múltiples capas de seguridad:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🔐 Encriptación</h4>
                <p className="text-sm text-gray-600">SSL/TLS para todas las comunicaciones. Datos sensibles encriptados en reposo.</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🔑 Autenticación</h4>
                <p className="text-sm text-gray-600">Contraseñas hasheadas con bcrypt. Tokens JWT para sesiones seguras.</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">💾 Backups</h4>
                <p className="text-sm text-gray-600">Copias de seguridad automáticas diarias con retención de 30 días.</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🛡️ Monitoreo</h4>
                <p className="text-sm text-gray-600">Detección de actividades sospechosas y protección contra ataques.</p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed">
              Sin embargo, ningún sistema es 100% seguro. Le recomendamos usar contraseñas fuertes 
              y no compartir sus credenciales de acceso.
            </p>
          </section>

          {/* 5. Sus Derechos */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900 m-0">5. Sus Derechos sobre sus Datos</h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              Usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li><strong>Acceso:</strong> Solicitar una copia de todos sus datos personales</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
              <li><strong>Eliminación:</strong> Solicitar la eliminación de su cuenta y datos (derecho al olvido)</li>
              <li><strong>Portabilidad:</strong> Exportar sus datos en formato estructurado (CSV, JSON)</li>
              <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos para marketing</li>
              <li><strong>Limitación:</strong> Solicitar la restricción del procesamiento de sus datos</li>
            </ul>

            <p className="text-gray-700 leading-relaxed">
              Para ejercer estos derechos, contáctenos en{' '}
              <a href="mailto:sistema@mundoiaple.com" className="text-blue-600 hover:text-blue-700 underline font-medium">
                sistema@mundoaple.com
              </a>
            </p>
          </section>

          {/* 6. Retención de Datos */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Retención de Datos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Conservamos sus datos mientras:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Su cuenta esté activa</li>
              <li>Sea necesario para proporcionar el servicio</li>
              <li>Sea requerido por obligaciones legales (mínimo 5 años para datos fiscales)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Tras la cancelación de su cuenta, conservamos sus datos por 30 días para permitir 
              la recuperación. Después, los datos son eliminados permanentemente, excepto aquellos 
              que debamos conservar por ley.
            </p>
          </section>

          {/* 7. Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies y Tecnologías Similares</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Utilizamos cookies para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Esenciales:</strong> Mantener su sesión activa y funcionalidad básica</li>
              <li><strong>Preferencias:</strong> Recordar sus configuraciones y preferencias</li>
              <li><strong>Análisis:</strong> Entender cómo usa el servicio (Google Analytics)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Puede configurar su navegador para rechazar cookies, pero esto puede afectar 
              la funcionalidad del servicio.
            </p>
          </section>

          {/* 8. Transferencias Internacionales */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Transferencias Internacionales</h2>
            <p className="text-gray-700 leading-relaxed">
              Sus datos pueden ser procesados en servidores ubicados fuera de Argentina. 
              Nos aseguramos de que estos proveedores cumplan con estándares de protección 
              de datos equivalentes mediante cláusulas contractuales estándar.
            </p>
          </section>

          {/* 9. Menores de Edad */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Privacidad de Menores</h2>
            <p className="text-gray-700 leading-relaxed">
              Nuestro servicio no está dirigido a menores de 18 años. No recopilamos 
              intencionalmente información de menores. Si descubrimos que hemos recopilado 
              datos de un menor, los eliminaremos inmediatamente.
            </p>
          </section>

          {/* 10. Cambios en la Política */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cambios en esta Política</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos 
              sobre cambios significativos por email o mediante un aviso en el servicio. 
              La fecha de "Última actualización" al inicio indica cuándo se realizó la última modificación.
            </p>
          </section>

          {/* 11. Contacto */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contacto</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para consultas sobre privacidad o ejercer sus derechos:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <ul className="list-none space-y-3 text-gray-700">
                <li className="flex items-center gap-3">
                  <span className="font-semibold min-w-[100px]">Email:</span>
                  <a href="mailto:sistema@mundoiaple.com" className="text-blue-600 hover:text-blue-700 underline">
                    sistema@mundoiaple.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="font-semibold min-w-[100px]">WhatsApp:</span>
                  <a href="https://wa.me/5491144224497" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                    +54 11 4422-4497
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="font-semibold min-w-[100px]">Sitio web:</span>
                  <a href="https://www.mundoiaple.store" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                    www.mundoiaple.store
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* Compromiso */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mt-12">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Nuestro Compromiso</h3>
            <p className="text-gray-700 leading-relaxed">
              En MundoIAple, la privacidad y seguridad de sus datos es nuestra prioridad. 
              Trabajamos constantemente para mantener los más altos estándares de protección 
              y transparencia en el manejo de su información.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            © 2023 MundoIAple. Todos los derechos reservados.
          </p>
        </div>
      </main>
    </div>
  );
}
