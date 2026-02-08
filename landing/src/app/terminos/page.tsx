'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TerminosPage() {
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
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Términos y Condiciones
        </h1>
        <p className="text-gray-600 mb-12">
          Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="prose prose-lg max-w-none">
          {/* 1. Aceptación */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Al acceder y utilizar Clodeb ("el Servicio"), usted acepta estar sujeto a estos Términos y Condiciones. 
              Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Clodeb es una plataforma de gestión empresarial con inteligencia artificial que incluye funcionalidades 
              de inventario, punto de venta, CRM, asistente virtual y automatización de procesos.
            </p>
          </section>

          {/* 2. Descripción del Servicio */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descripción del Servicio</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Clodeb proporciona:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Sistema de gestión de inventario y productos</li>
              <li>Punto de venta (POS) integrado</li>
              <li>CRM para gestión de clientes</li>
              <li>Asistente de IA para atención automatizada 24/7</li>
              <li>Sistema de turnos y reservas</li>
              <li>Reportes y análisis de ventas</li>
              <li>Integración con WhatsApp Business</li>
            </ul>
          </section>

          {/* 3. Registro y Cuenta */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Registro y Cuenta de Usuario</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para utilizar el Servicio, debe:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Proporcionar información precisa y completa durante el registro</li>
              <li>Mantener la seguridad de su contraseña y cuenta</li>
              <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
              <li>Ser mayor de 18 años o tener autorización de un tutor legal</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Usted es responsable de todas las actividades que ocurran bajo su cuenta.
            </p>
          </section>

          {/* 4. Planes y Pagos */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Planes y Pagos</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Planes Disponibles</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Plan Gratuito:</strong> 7 días de prueba con funcionalidades limitadas</li>
              <li><strong>Plan Básico:</strong> USD $59/mes - Gestión completa sin IA</li>
              <li><strong>Plan Profesional:</strong> USD $179/mes - Incluye asistente IA y todas las funcionalidades</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Facturación</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Los pagos se procesan de forma mensual o anual según el plan seleccionado. Aceptamos:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>MercadoPago (transferencia bancaria)</li>
              <li>Criptomonedas (USDT vía Binance)</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Renovación Automática</h3>
            <p className="text-gray-700 leading-relaxed">
              Los planes se renuevan automáticamente al final de cada período de facturación, 
              a menos que cancele su suscripción antes de la fecha de renovación.
            </p>
          </section>

          {/* 5. Cancelación y Reembolsos */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cancelación y Reembolsos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Puede cancelar su suscripción en cualquier momento desde su panel de control. 
              La cancelación será efectiva al final del período de facturación actual.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Política de Reembolsos:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>No se realizan reembolsos por períodos parciales</li>
              <li>Los reembolsos se consideran caso por caso dentro de los primeros 7 días</li>
              <li>Los planes anuales no son reembolsables después de 30 días</li>
            </ul>
          </section>

          {/* 6. Uso Aceptable */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Uso Aceptable</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Usted se compromete a NO:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Utilizar el Servicio para actividades ilegales o fraudulentas</li>
              <li>Intentar acceder a sistemas o datos no autorizados</li>
              <li>Distribuir malware, virus o código malicioso</li>
              <li>Realizar ingeniería inversa del software</li>
              <li>Revender o redistribuir el Servicio sin autorización</li>
              <li>Enviar spam o contenido no solicitado a través del sistema</li>
              <li>Violar derechos de propiedad intelectual</li>
            </ul>
          </section>

          {/* 7. Propiedad Intelectual */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propiedad Intelectual</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Todo el contenido, diseño, código, marcas y materiales del Servicio son propiedad de Clodeb 
              y están protegidos por leyes de propiedad intelectual.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Los datos que usted ingrese en el sistema (productos, clientes, ventas) son de su propiedad. 
              Clodeb no reclamará derechos sobre sus datos comerciales.
            </p>
          </section>

          {/* 8. Privacidad y Datos */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacidad y Protección de Datos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              El uso de sus datos personales está regido por nuestra{' '}
              <Link href="/privacidad" className="text-blue-600 hover:text-blue-700 underline font-medium">
                Política de Privacidad
              </Link>.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos, 
              incluyendo encriptación SSL, backups automáticos y controles de acceso.
            </p>
          </section>

          {/* 9. Limitación de Responsabilidad */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitación de Responsabilidad</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              El Servicio se proporciona "tal cual" y "según disponibilidad". Clodeb no garantiza:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Disponibilidad ininterrumpida del servicio</li>
              <li>Ausencia de errores o bugs</li>
              <li>Resultados específicos de negocio</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Clodeb no será responsable por daños indirectos, incidentales o consecuentes 
              derivados del uso o imposibilidad de uso del Servicio.
            </p>
          </section>

          {/* 10. Modificaciones */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modificaciones del Servicio</h2>
            <p className="text-gray-700 leading-relaxed">
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del Servicio 
              en cualquier momento. Le notificaremos sobre cambios significativos con al menos 30 días de anticipación.
            </p>
          </section>

          {/* 11. Terminación */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Terminación</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Podemos suspender o terminar su acceso al Servicio si:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Viola estos Términos y Condiciones</li>
              <li>No realiza los pagos correspondientes</li>
              <li>Utiliza el Servicio de manera fraudulenta o ilegal</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Tras la terminación, tendrá 30 días para exportar sus datos antes de que sean eliminados permanentemente.
            </p>
          </section>

          {/* 12. Ley Aplicable */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Ley Aplicable y Jurisdicción</h2>
            <p className="text-gray-700 leading-relaxed">
              Estos Términos se rigen por las leyes de la República Argentina. 
              Cualquier disputa será resuelta en los tribunales de la Ciudad Autónoma de Buenos Aires.
            </p>
          </section>

          {/* 13. Contacto */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contacto</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para consultas sobre estos Términos y Condiciones, puede contactarnos:
            </p>
            <ul className="list-none space-y-2 text-gray-700">
              <li><strong>Email:</strong> sistema@Clodeb.com</li>
              <li><strong>WhatsApp:</strong> +54 11 4422-4497</li>
              <li><strong>Sitio web:</strong> www.Clodeb.store</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            © 2023 Clodeb. Todos los derechos reservados.
          </p>
        </div>
      </main>
    </div>
  );
}
