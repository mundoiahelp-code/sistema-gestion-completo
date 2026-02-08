'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X, Loader2, ArrowRight, Sparkles, Shield, Zap, Clock, Users, BarChart2, MessageSquare, Calendar, Package, CreditCard, Mail, RefreshCw } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { toast } from 'sonner';
import PaymentModal from '@/components/PaymentModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sistema-gestion-production-d961.up.railway.app/api';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.mundoaple.store';
const WHATSAPP_NUMBER = '5491144224497';

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showEmailSentModal, setShowEmailSentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [modalType, setModalType] = useState<'free' | 'basic' | 'pro'>('free');
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'crypto' | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Componente Screenshot con efecto 3D
  const ScreenshotWith3D = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateXValue = ((y - centerY) / centerY) * -10;
      const rotateYValue = ((x - centerX) / centerX) * 10;
      setRotateX(rotateXValue);
      setRotateY(rotateYValue);
    };

    const handleMouseLeave = () => {
      setRotateX(0);
      setRotateY(0);
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative perspective-1000"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          className="relative"
          animate={{
            rotateX,
            rotateY,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
            <img src="/screenshots/dashboard.png" alt="Dashboard" className="w-full" />
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 via-transparent to-violet-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500" />
          </div>
          {/* Floating decorative elements */}
          <motion.div
            className="absolute -top-4 -right-4 w-72 h-72 bg-blue-500/20 rounded-full filter blur-3xl opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-8 -left-4 w-72 h-72 bg-violet-500/20 rounded-full filter blur-3xl opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.25, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </motion.div>
      </motion.div>
    );
  };

  // Componente FeatureCard con efecto 3D en hover
  const FeatureCard = ({ feature, index }: { feature: any; index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateXValue = ((y - centerY) / centerY) * -8;
      const rotateYValue = ((x - centerX) / centerX) * 8;
      setRotateX(rotateXValue);
      setRotateY(rotateYValue);
    };

    const handleMouseLeave = () => {
      setRotateX(0);
      setRotateY(0);
      setIsHovered(false);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        className="perspective-1000"
      >
        <motion.div
          animate={{
            rotateX,
            rotateY,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            transformStyle: "preserve-3d",
          }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 relative overflow-hidden"
        >
          {/* Glow effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-pink-500/10 opacity-0"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
          
          <div className="relative z-10">
            <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-4`}>
              <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-white">{feature.title}</h3>
              {feature.badge && (
                <span className="text-xs font-semibold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full">
                  {feature.badge}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const openModal = (type: 'free' | 'basic' | 'pro') => {
    setModalType(type);
    setPaymentMethod(null);
    setFormData({ name: '', email: '', phone: '' });
    setShowModal(true);
  };

  const handleFreeTrial = async () => {
    if (!formData.name || !formData.email) { 
      toast.error('Completá nombre y email'); 
      return; 
    }
    
    setShowModal(false);
    toast.success('¡Continuá con tu registro!');
    
    try {
      // Crear tenant temporal y obtener token
      const res = await fetch(`${API_URL}/payments/create-activation-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: formData.name, 
          email: formData.email,
          locale: 'es'
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear registro');
      }
      
      // Redirigir con token en lugar de datos en URL
      setTimeout(() => {
        window.location.href = `${APP_URL}/activar-cuenta/${data.token}`;
      }, 500);
      
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar registro');
      setShowModal(true);
    }
  };

  const handleResendEmail = async () => {
    if (!sentEmail) return;
    setResendingEmail(true);
    try {
      const res = await fetch(`${API_URL}/payments/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sentEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Email reenviado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al reenviar');
    } finally {
      setResendingEmail(false);
    }
  };

  const handlePayment = async () => {
    if (!formData.name || !formData.email || !paymentMethod) { 
      toast.error('Completá todos los campos'); 
      return; 
    }
    
    if (!acceptedTerms) {
      toast.error('Debes aceptar los términos y condiciones');
      return;
    }
    
    // Cerrar modal de selección y mostrar pantalla de carga
    setShowModal(false);
    setShowLoadingScreen(true);
    
    // Secuencia de mensajes animados
    const messages = [
      'Configurando tu cuenta',
      'Inicializando asistente IA',
      'Finalizando configuración'
    ];
    
    let currentIndex = 0;
    setLoadingMessage(messages[0]);
    
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < messages.length) {
        setLoadingMessage(messages[currentIndex]);
      } else {
        clearInterval(interval);
        // Después de todos los mensajes, mostrar el modal de pago
        setTimeout(() => {
          setShowLoadingScreen(false);
          setShowPaymentModal(true);
        }, 800);
      }
    }, 1500); // Cada mensaje dura 1.5 segundos
  };

  // Smooth scroll
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] antialiased scroll-smooth overflow-x-hidden">
      {/* Animated Grid Background - Efecto artesanal */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }} />
      </div>

      {/* Floating Orbs - Animación orgánica personalizada */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 80, 0],
            y: [0, -80, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
          className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl"
        />
      </div>
      
      {/* NAV - Glassmorphism effect */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/60 backdrop-blur-2xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <motion.button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img 
              src="/screenshots/logo-solo-clodeb.png" 
              alt="Clodeb" 
              className="h-12 w-auto object-contain"
              style={{ imageRendering: 'crisp-edges' }}
            />
            <span className="text-lg font-semibold text-white hidden sm:block">Clodeb</span>
          </motion.button>
          <div className="flex items-center gap-6">
            <button onClick={() => scrollTo('funciones')} className="text-sm text-gray-400 hover:text-white transition hidden md:block font-medium">Funciones</button>
            <button onClick={() => scrollTo('planes')} className="text-sm text-gray-400 hover:text-white transition hidden md:block font-medium">Planes</button>
            <a href={`${APP_URL}/iniciar-sesion`} className="text-sm text-gray-400 hover:text-white transition font-medium">Ingresar</a>
            <motion.button 
              onClick={() => openModal('free')} 
              className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Probar gratis
            </motion.button>
          </div>
        </div>
      </nav>

      {/* HERO - Con efectos 3D y parallax */}
      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-[#0a0a0a] via-[#111111] to-[#0a0a0a] overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} 
            className="text-center mb-16"
          >
            {/* Badge con animación de brillo */}
            <motion.div 
              className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />
              <Sparkles className="w-4 h-4 text-blue-400 relative z-10" />
              <span className="text-sm text-blue-400 font-medium relative z-10">Sistema de gestión con IA</span>
            </motion.div>
            
            {/* Título con gradiente animado */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 text-white">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="block"
              >
                Todo tu negocio Apple
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="block bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
              >
                en un solo sistema
              </motion.span>
            </h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Inventario, ventas, clientes y un Asistente IA que responde 24/7 por vos.
              <br className="hidden sm:block" />
              Tu negocio funcionando solo, incluso cuando dormís.
            </motion.p>
            
            {/* Botones con efectos hover únicos */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.button 
                onClick={() => openModal('free')} 
                className="group relative inline-flex items-center justify-center gap-2 bg-white text-black font-semibold px-8 py-4 rounded-lg overflow-hidden text-lg shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-violet-400 opacity-0 group-hover:opacity-20 transition-opacity"
                />
                <span className="relative z-10">Probar 7 días gratis</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              </motion.button>
              <motion.button 
                onClick={() => setShowContactModal(true)} 
                className="group inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white font-semibold px-8 py-4 rounded-lg hover:bg-white/10 transition text-lg backdrop-blur-sm"
                whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageSquare className="w-5 h-5" />
                Contactar
              </motion.button>
            </motion.div>
          </motion.div>
          
          {/* Screenshot con efecto 3D que responde al mouse */}
          <ScreenshotWith3D />
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 px-6 bg-[#0a0a0a] border-y border-white/[0.08]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '24/7', label: 'Asistente activo' },
            { value: '+20', label: 'Negocios' },
            { value: '99.9%', label: 'Uptime' },
            { value: '<5s', label: 'Respuesta' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES GRID - Con efectos 3D en hover */}
      <section id="funciones" className="py-24 px-6 bg-[#111111] relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Todo lo que necesitás</h2>
            <p className="text-xl text-gray-400">Un sistema completo para hacer crecer tu negocio</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: 'Asistente IA', desc: 'Responde consultas, muestra stock en tiempo real y agenda turnos automáticamente 24/7', badge: 'Pro', color: 'violet' },
              { icon: Package, title: 'Inventario rápido', desc: 'Control de stock en tiempo real con seguimiento por número de serie/IMEI', color: 'blue' },
              { icon: CreditCard, title: 'Punto de Venta', desc: 'Registrá ventas en segundos. Efectivo, tarjeta, transferencia o crypto', color: 'emerald' },
              { icon: Calendar, title: 'Turnos Online', desc: 'Tus clientes reservan desde WhatsApp sin que hagas nada', badge: 'Pro', color: 'orange' },
              { icon: Users, title: 'CRM Clientes', desc: 'Historial completo de compras, chats y preferencias de cada cliente', badge: 'Pro', color: 'pink' },
              { icon: BarChart2, title: 'Reportes', desc: 'Dashboard en vivo con métricas de ventas, productos y ganancias', color: 'indigo' },
            ].map((feature, i) => (
              <FeatureCard key={i} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS - Chat + Screenshot */}
      <section className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              El Asistente agenda turnos<br />
              <span className="text-gray-500">mientras vos descansás</span>
            </h2>
            <p className="text-xl text-gray-400">Mirá cómo funciona en tiempo real</p>
          </div>
          
          {/* Sistema + iPhone Chat lado a lado */}
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-400" />
              </div>
              <span className="text-sm font-semibold text-green-400">Turno creado automáticamente en el sistema</span>
            </div>
            
            <div className="relative flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Screenshot del sistema */}
              <div className="relative overflow-hidden w-full lg:max-w-[750px] rounded-2xl shadow-2xl border border-white/10">
                <img src="/screenshots/turnos.png" alt="Sistema de turnos" className="w-full" />
              </div>
              
              {/* Imagen del chat de WhatsApp */}
              <div className="relative flex-shrink-0 hidden md:block">
                <img 
                  src="/screenshots/chat-whatsapp.png" 
                  alt="Chat WhatsApp" 
                  className="w-[280px] lg:w-[320px] h-auto drop-shadow-2xl rounded-3xl"
                />
              </div>
            </div>
          </div>
          
          {/* Features below */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {[
              { icon: Clock, title: 'Ahorrá tiempo', desc: 'El asistente responde mientras vos hacés otras cosas', color: 'blue' },
              { icon: Zap, title: 'Vendé más', desc: 'Nunca pierdas una venta por no responder a tiempo', color: 'violet' },
              { icon: Shield, title: 'Todo organizado', desc: 'Stock, ventas, ingresos y clientes en un solo lugar', color: 'emerald' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition">
                <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/10 flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-400`} />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="planes" className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Precios simples y transparentes</h2>
            <p className="text-xl text-gray-400">Elegí el plan que mejor se adapte a tu negocio</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* FREE */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              className="bg-white/[0.03] border border-white/10 rounded-xl p-8 hover:border-white/20 transition-all hover:bg-white/[0.05]"
            >
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Prueba gratuita</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-white">Gratis</span>
                </div>
                <p className="text-gray-500 text-sm">7 días para probar</p>
              </div>
              
              <button 
                onClick={() => openModal('free')} 
                className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium py-3 px-6 rounded-lg transition mb-8"
              >
                Comenzar prueba
              </button>
              
              <div className="space-y-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Incluye</p>
                {[
                  { text: 'Productos ilimitados', desc: 'Sin límite de SKUs' },
                  { text: 'Ventas ilimitadas', desc: 'Registrá todas tus ventas' },
                  { text: 'Punto de venta completo', desc: 'Efectivo, tarjeta, transferencia' },
                  { text: 'Reportes básicos', desc: 'Ventas diarias y mensuales' },
                  { text: 'Hasta 4 usuarios', desc: 'Equipo pequeño' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-300 text-sm block">{f.text}</span>
                      <span className="text-gray-600 text-xs">{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* BASIC */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: 0.1 }}
              className="bg-white/[0.03] border border-white/10 rounded-xl p-8 hover:border-blue-500/50 transition-all hover:bg-white/[0.05] relative"
            >
              <div className="mb-8">
                <h3 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-3">Básico</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl text-gray-600 line-through">$89</span>
                  <span className="text-5xl font-bold text-white">$59</span>
                  <span className="text-gray-500">/mes</span>
                </div>
                <div className="inline-block bg-green-500/10 text-green-400 text-xs font-medium px-2 py-1 rounded mt-2">
                  Ahorrás $30/mes
                </div>
              </div>
              
              <button 
                onClick={() => openModal('basic')} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition mb-8"
              >
                Comenzar ahora
              </button>
              
              <div className="space-y-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Todo en Gratis, más</p>
                {[
                  { text: 'Inventario con IMEI/Serie', desc: 'Seguimiento individual de productos' },
                  { text: 'CRM de clientes', desc: 'Historial de compras y contactos' },
                  { text: 'Multi-sucursal', desc: 'Gestioná varias ubicaciones' },
                  { text: 'Reportes avanzados', desc: 'Análisis detallado de ventas' },
                  { text: 'Hasta 8 usuarios', desc: 'Equipo mediano' },
                  { text: 'Soporte prioritario', desc: 'Respuesta en 24hs' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-300 text-sm block">{f.text}</span>
                      <span className="text-gray-600 text-xs">{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* PRO */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-b from-violet-500/10 to-blue-500/10 border border-violet-500/50 rounded-xl p-8 hover:border-violet-500 transition-all relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Más popular
              </div>
              
              <div className="mb-8 mt-2">
                <h3 className="text-sm font-medium text-violet-400 uppercase tracking-wider mb-3">Profesional</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl text-gray-600 line-through">$249</span>
                  <span className="text-5xl font-bold text-white">$179</span>
                  <span className="text-gray-500">/mes</span>
                </div>
                <div className="inline-block bg-violet-500/20 text-violet-300 text-xs font-medium px-2 py-1 rounded mt-2">
                  Ahorrás $70/mes
                </div>
              </div>
              
              <button 
                onClick={() => openModal('pro')} 
                className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition mb-8"
              >
                Comenzar ahora
              </button>
              
              <div className="space-y-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Todo en Básico, más</p>
                {[
                  { text: 'Asistente IA 24/7', desc: 'Responde automáticamente por WhatsApp' },
                  { text: 'WhatsApp integrado', desc: 'Conversaciones en el sistema' },
                  { text: 'Turnos automáticos', desc: 'Agenda sin intervención humana' },
                  { text: 'CRM completo + historial', desc: 'Seguimiento total del cliente' },
                  { text: 'Broadcast masivo', desc: 'Envía stock diario a todos tus grupos/difusion' },
                  { text: 'Hasta 18 usuarios', desc: 'Equipo grande' },
                  { text: 'Soporte VIP', desc: 'Respuesta inmediata + WhatsApp directo' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-white text-sm block font-medium">{f.text}</span>
                      <span className="text-gray-500 text-xs">{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          
          {/* Trust badges */}
          <div className="mt-16 flex items-center justify-center gap-12 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Pago seguro SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span>Cancelación flexible</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Activación inmediata</span>
            </div>
          </div>
        </div>
      </section>

      {/* PLANES ANUALES */}
      <section id="anuales" className="py-24 px-6 bg-[#111111]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-sm text-green-400 font-semibold">Ahorrá 2 meses pagando anual</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Planes Anuales</h2>
            <p className="text-xl text-gray-400">Pagá una vez, usá todo el año</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* BÁSICO ANUAL */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white/[0.03] border border-white/10 rounded-xl p-8 hover:bg-white/[0.05] hover:border-white/20 transition">
              <div className="mb-6">
                <p className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-2">Básico Anual</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base text-gray-600 line-through">USD $708</span>
                  <div className="bg-green-500/10 text-green-400 text-xs font-medium px-2 py-1 rounded">
                    -17% OFF
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-white">USD $590</p>
                  <span className="text-gray-500">/año</span>
                </div>
                <p className="text-green-400 text-sm mt-2 font-medium">Ahorrás USD $118 al año</p>
              </div>
              <p className="text-gray-400 text-sm mb-6 pb-6 border-b border-white/10">
                Plan Básico por un año completo
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Todo lo del Plan Básico mensual',
                  'Actualizaciones 1 año',
                  'Soporte WhatsApp 6 meses',
                  'Precio congelado'
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Quiero contratar el plan Básico Anual`} target="_blank" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2">
                Contratar anual
              </a>
            </motion.div>

            {/* PRO ANUAL */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="relative bg-gradient-to-b from-violet-500/10 to-blue-500/10 border border-violet-500/50 rounded-xl p-8 hover:border-violet-500 transition">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Recomendado
              </div>
              <div className="mb-6 mt-2">
                <p className="text-sm font-medium text-violet-400 uppercase tracking-wider mb-2">Pro Anual</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base text-gray-600 line-through">USD $2,148</span>
                  <div className="bg-violet-500/20 text-violet-300 text-xs font-medium px-2 py-1 rounded">
                    -17% OFF
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-white">USD $1,790</p>
                  <span className="text-gray-500">/año</span>
                </div>
                <p className="text-violet-400 text-sm mt-2 font-medium">Ahorrás USD $358 al año</p>
              </div>
              <p className="text-gray-300 text-sm mb-6 pb-6 border-b border-white/10">
                Plan Pro completo con setup incluido
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Todo del Plan Pro',
                  'Setup incluido',
                  'Soporte prioritario 1 año',
                  'Capacitación',
                  'Precio congelado'
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white font-medium">
                    <Check className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola! Quiero contratar el plan Pro Anual`} target="_blank" className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2">
                Contratar anual
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-white/[0.08] bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/screenshots/logo-solo-clodeb.png" 
                alt="Clodeb" 
                className="h-12 w-auto object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
              <span className="font-semibold text-white">Clodeb</span>
            </div>
            <div className="flex items-center gap-6">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" className="text-gray-400 hover:text-white transition text-sm font-medium">WhatsApp</a>
              <a href="/terminos" className="text-gray-400 hover:text-white transition text-sm font-medium">Términos</a>
              <a href="/privacidad" className="text-gray-400 hover:text-white transition text-sm font-medium">Privacidad</a>
              <a href={`${APP_URL}/iniciar-sesion`} className="text-gray-400 hover:text-white transition text-sm font-medium">Ingresar</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/[0.08] text-center">
            <p className="text-sm text-gray-500">© 2023 Clodeb. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl"
          >
            {/* Close button */}
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="p-8 md:p-12">
              {/* Header */}
              <div className="mb-8">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 ${
                  modalType === 'free' ? 'bg-gray-100 text-gray-700' : 
                  modalType === 'basic' ? 'bg-blue-50 text-blue-700' : 
                  'bg-violet-50 text-violet-700'
                }`}>
                  {modalType === 'free' ? 'Prueba gratuita' : modalType === 'basic' ? 'Plan Básico' : 'Plan Profesional'}
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {modalType === 'free' ? 'Comenzá gratis' : 'Completá tus datos'}
                </h2>
                
                {modalType === 'free' ? (
                  <p className="text-gray-600 text-lg">7 días de prueba sin tarjeta</p>
                ) : (
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-2xl text-gray-400 line-through">USD ${modalType === 'basic' ? '89' : '249'}</span>
                    <span className="text-5xl font-bold text-gray-900">USD ${modalType === 'basic' ? '59' : '179'}</span>
                    <span className="text-gray-600 text-xl">/mes</span>
                  </div>
                )}
              </div>

              {/* Form */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                  <input 
                    type="text" 
                    placeholder="Nicolas Percio" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    placeholder="nicodelpercio@gmail.com" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition" 
                  />
                </div>
                
                {modalType !== 'free' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono (opcional)</label>
                      <input 
                        type="tel" 
                        placeholder="+54 11 1234-5678" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                        className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Método de pago</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setPaymentMethod('mercadopago')} 
                          className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                            paymentMethod === 'mercadopago' 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'mercadopago' && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="text-2xl mb-2">💳</div>
                          <p className="font-semibold text-gray-900 text-sm">MercadoPago</p>
                          <p className="text-gray-500 text-xs mt-1">Transferencia</p>
                        </button>
                        
                        <button 
                          onClick={() => setPaymentMethod('crypto')} 
                          className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                            paymentMethod === 'crypto' 
                              ? 'border-amber-500 bg-amber-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'crypto' && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="text-2xl mb-2">₿</div>
                          <p className="font-semibold text-gray-900 text-sm">Binance</p>
                          <p className="text-gray-500 text-xs mt-1">USDT (TRC20)</p>
                        </button>
                      </div>
                    </div>

                    {/* Términos */}
                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex-shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="w-5 h-5 rounded border-2 border-gray-300 bg-white checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition"
                          />
                          {acceptedTerms && (
                            <Check className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none" />
                          )}
                        </div>
                        <span className="text-sm text-gray-600 leading-relaxed">
                          Acepto los{' '}
                          <a 
                            href="/terminos" 
                            target="_blank" 
                            className="text-blue-600 hover:text-blue-700 underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            términos y condiciones
                          </a>
                          {' '}y la{' '}
                          <a 
                            href="/privacidad" 
                            target="_blank" 
                            className="text-blue-600 hover:text-blue-700 underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            política de privacidad
                          </a>
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              {/* Button */}
              <button 
                onClick={modalType === 'free' ? handleFreeTrial : handlePayment} 
                disabled={loading} 
                className={`w-full mt-8 font-semibold py-4 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg ${
                  modalType === 'free' 
                    ? 'bg-gray-900 hover:bg-gray-800 text-white' 
                    : modalType === 'basic'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-lg'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {modalType === 'free' ? 'Comenzar prueba gratuita' : 'Continuar al pago'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Trust badges */}
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Pago seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Activación inmediata</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL DE CONTACTO */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4" onClick={() => setShowContactModal(false)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-md"
          >
            <div className="bg-gradient-to-b from-[#18181b] to-[#0f0f12] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/[0.08]">
              {/* Glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-20 bg-violet-500" />
              
              {/* Close */}
              <button onClick={() => setShowContactModal(false)} className="absolute top-3 right-3 md:top-4 md:right-4 z-10 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
                <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/60" />
              </button>

              <div className="relative p-6 md:p-8 text-center">
                {/* Icon */}
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">¿Cómo querés contactarnos?</h2>
                <p className="text-white/50 text-sm md:text-base mb-6 md:mb-8">Elegí el medio que prefieras</p>

                {/* Opciones */}
                <div className="space-y-2 md:space-y-3">
                  <a 
                    href="https://wa.me/5491144224497" 
                    target="_blank"
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-white text-sm md:text-base">WhatsApp</p>
                      <p className="text-emerald-400 text-xs md:text-sm">+54 11 4422-4497</p>
                    </div>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </a>

                  <a 
                    href="mailto:sistema@Clodeb.com" 
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-white text-sm md:text-base">Email</p>
                      <p className="text-blue-400 text-xs md:text-sm">sistema@Clodeb.com</p>
                    </div>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </a>
                </div>

                <p className="text-white/30 text-[10px] md:text-xs mt-4 md:mt-6">Respondemos en menos de 24hs</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL EMAIL ENVIADO */}
      {showEmailSentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEmailSentModal(false)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-md"
          >
            <div className="bg-gradient-to-b from-[#18181b] to-[#0f0f12] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/[0.08]">
              {/* Glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-30 bg-emerald-500" />
              
              {/* Close */}
              <button onClick={() => setShowEmailSentModal(false)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
                <X className="w-4 h-4 text-white/60" />
              </button>

              <div className="relative p-8 text-center">
                {/* Icon animado */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6"
                >
                  <Mail className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-white mb-2">¡Revisá tu email!</h2>
                <p className="text-white/50 mb-2">Te enviamos un link de verificación a:</p>
                <p className="text-emerald-400 font-medium text-lg mb-6">{sentEmail}</p>

                <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                  <p className="text-white/70 text-sm mb-3">📬 Revisá tu bandeja de entrada</p>
                  <p className="text-white/70 text-sm mb-3">📁 Si no lo ves, revisá spam o promociones</p>
                  <p className="text-white/70 text-sm">⏰ El link expira en 24 horas</p>
                </div>

                {/* Botón reenviar */}
                <button
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition disabled:opacity-50"
                >
                  {resendingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {resendingEmail ? 'Reenviando...' : '¿No llegó? Reenviar email'}
                </button>

                <p className="text-white/30 text-xs mt-6">
                  ¿Problemas? Contactanos a sistema@Clodeb.com
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* PANTALLA DE CARGA PROFESIONAL */}
      {showLoadingScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          {/* Logo en la esquina superior izquierda */}
          <div className="absolute top-8 left-8 flex items-center gap-3">
            <img 
              src="/screenshots/logo-solo-clodeb.png" 
              alt="Clodeb" 
              className="h-14 w-auto object-contain"
              style={{ imageRendering: 'crisp-edges' }}
            />
            <span className="text-xl font-semibold text-gray-900">Clodeb</span>
          </div>

          {/* Contenido central */}
          <div className="max-w-md w-full px-6">
            {/* Barra de progreso minimalista */}
            <div className="mb-12">
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4.5, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-blue-600 to-violet-600"
                />
              </div>
            </div>

            {/* Mensaje principal */}
            <motion.div
              key={loadingMessage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                {loadingMessage}
              </h2>
              <p className="text-gray-500 text-base">
                Esto solo tomará unos segundos
              </p>
            </motion.div>

            {/* Indicadores de progreso (checkmarks) */}
            <div className="mt-12 space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-600">Configuración del sistema</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: loadingMessage.includes('asistente') || loadingMessage.includes('máximo') ? 1 : 0.3, x: 0 }}
                transition={{ delay: 1.5 }}
                className="flex items-center gap-3"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  loadingMessage.includes('asistente') || loadingMessage.includes('máximo')
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}>
                  {(loadingMessage.includes('asistente') || loadingMessage.includes('máximo')) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className={`text-sm ${
                  loadingMessage.includes('asistente') || loadingMessage.includes('máximo')
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }`}>
                  Preparación de IA
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: loadingMessage.includes('máximo') ? 1 : 0.3, x: 0 }}
                transition={{ delay: 2.5 }}
                className="flex items-center gap-3"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  loadingMessage.includes('máximo')
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}>
                  {loadingMessage.includes('máximo') && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className={`text-sm ${
                  loadingMessage.includes('máximo')
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }`}>
                  Optimización final
                </span>
              </motion.div>
            </div>

            {/* Badges de confianza */}
            <div className="mt-16 pt-8 border-t border-gray-100">
              <div className="flex items-center justify-center gap-8 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Pago seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>SSL Certificado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Activación inmediata</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO CON VERIFICACIÓN AUTOMÁTICA */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={modalType === 'basic' ? 'basic' : 'pro'}
        userData={formData}
        paymentMethod={paymentMethod || 'mercadopago'}
      />
    </div>
  );
}
