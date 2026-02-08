'use client';

import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  Send,
  Settings,
  RefreshCw,
  Filter,
  MoreVertical,
  Tag,
  Edit,
  CheckCircle,
  X,
  Search,
  Trash2,
  Copy,
  Check,
  Instagram,
  Palette,
  Camera,
  Clock,
  QrCode,
} from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProductPhotosSettings from '@/components/settings/ProductPhotosSettings';
import BroadcastChannels from '@/components/crm/BroadcastChannels';
import useGetUserInfo from '@/hooks/useGetUserInfo';
import { Role } from '@/enums/role.enum';
import { getFeaturesForLocale } from '@/lib/features';
import { useTranslation } from '@/i18n/I18nProvider';
import { usePlan } from '@/hooks/usePlan';
import UpgradePrompt from '@/components/common/UpgradePrompt';

// If CRM feature is disabled (English locale), show message
function CRMDisabledMessage() {
  const { locale } = useTranslation();
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center max-w-md">
        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
        <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
          {locale === 'es' ? 'CRM no disponible' : 'CRM not available'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          {locale === 'es' 
            ? 'El módulo de CRM no está disponible en esta versión.'
            : 'The CRM module is not available in this version.'}
        </p>
      </div>
    </div>
  );
}

// Importar logo de WhatsApp desde un SVG o usar un componente
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);
import axios from 'axios';
import Cookies from 'js-cookie';

interface ChatConversation {
  customerPhone: string;
  customerName: string;
  originalJid?: string; // JID original de WhatsApp para responder
  lastMessage: string;
  lastMessageTime: Date;
  messages: ChatMessageItem[];
  category?: string;
  notes?: string;
  resolved?: boolean;
  unreadCount?: number; // Contador de mensajes no leídos
}

interface ChatMessageItem {
  id: string;
  message: string;
  timestamp: Date;
  intent: string;
  isFromCustomer: boolean;
}

const DEFAULT_CATEGORIES = [
  { value: 'ventas', label: 'Ventas', color: 'bg-blue-500' },
  { value: 'tecnico', label: 'Técnico', color: 'bg-purple-500' },
  { value: 'consulta', label: 'Consulta', color: 'bg-green-500' },
  { value: 'reclamo', label: 'Reclamo', color: 'bg-red-500' },
  { value: 'seguimiento', label: 'Seguimiento', color: 'bg-yellow-500' },
];

const AVAILABLE_COLORS = [
  { value: 'bg-blue-500', label: 'Azul' },
  { value: 'bg-green-500', label: 'Verde' },
  { value: 'bg-red-500', label: 'Rojo' },
  { value: 'bg-yellow-500', label: 'Amarillo' },
  { value: 'bg-purple-500', label: 'Morado' },
  { value: 'bg-pink-500', label: 'Rosa' },
  { value: 'bg-orange-500', label: 'Naranja' },
  { value: 'bg-teal-500', label: 'Turquesa' },
  { value: 'bg-indigo-500', label: 'Índigo' },
  { value: 'bg-gray-500', label: 'Gris' },
];

type Platform = 'whatsapp' | 'instagram';

// Wrapper component to check locale
function CRMPageContent() {
  const { role, name: userName } = useGetUserInfo();
  const isAdmin = role === Role.Admin;
  
  const [platform, setPlatform] = useState<Platform>('whatsapp');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ChatConversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [readChats, setReadChats] = useState<Set<string>>(new Set()); // Trackear chats leídos
  const [newMessage, setNewMessage] = useState('');
  const [customCategories, setCustomCategories] = useState<Array<{ value: string; label: string; color: string }>>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('bg-blue-500');
  const [editingCategory, setEditingCategory] = useState<{ value: string; label: string; color: string } | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [colorWarning, setColorWarning] = useState<string>('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingBotAction, setPendingBotAction] = useState<'activate' | 'pause' | null>(null);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingClientName, setEditingClientName] = useState(false);
  const [tempClientName, setTempClientName] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  
  // Estados para el modal de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<{ phone: string; name: string } | null>(null);
  
  // Estados para el modal de confirmación de eliminación de categoría
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ value: string; label: string; isCustom: boolean } | null>(null);
  
  // Hook de plan para verificar features
  const { canAccess } = usePlan();
  const hasBot = canAccess('bot');
  
  // Estados para configuración - Separados por plataforma
  const [whatsappConfig, setWhatsappConfig] = useState({
    botActive: true,
  });
  
  const [instagramConfig, setInstagramConfig] = useState({
    botActive: true,
  });

  // Config actual según plataforma seleccionada
  const currentConfig = platform === 'whatsapp' ? whatsappConfig : instagramConfig;
  const setCurrentConfig = platform === 'whatsapp' ? setWhatsappConfig : setInstagramConfig;
  
  // Función para guardar configuración
  const saveConfig = () => {
    localStorage.setItem(`crm_${platform}_config`, JSON.stringify(currentConfig));
    alert(`Configuración de ${platform === 'whatsapp' ? 'WhatsApp' : 'Instagram'} guardada correctamente`);
  };

  // Función para verificar contraseña y cambiar estado del bot
  const handleBotToggle = () => {
    if (!isAdmin) return;
    
    const action = currentConfig.botActive ? 'pause' : 'activate';
    setPendingBotAction(action);
    setShowPasswordDialog(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const verifyPasswordAndToggleBot = async () => {
    try {
      // Intentar obtener el token de diferentes lugares
      const token = Cookies.get('accessToken') || Cookies.get('token');
      
      // Si no hay token, mostrar error
      if (!token) {
        setPasswordError('No hay sesión activa. Por favor, inicia sesión nuevamente.');
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-password`,
        { password: passwordInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.valid) {
        // Contraseña correcta, cambiar estado del bot
        setCurrentConfig({ ...currentConfig, botActive: !currentConfig.botActive });
        localStorage.setItem(`crm_${platform}_config`, JSON.stringify({
          ...currentConfig,
          botActive: !currentConfig.botActive
        }));
        setShowPasswordDialog(false);
        setPasswordInput('');
        setPasswordError('');
        setPendingBotAction(null);
      } else {
        setPasswordError('Contraseña incorrecta');
      }
    } catch (error: any) {
      console.error('Error verificando contraseña:', error);
      
      // Mostrar mensaje más específico según el error
      if (error.response) {
        // El servidor respondió con un error
        setPasswordError(error.response.data?.error || 'Contraseña incorrecta');
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        setPasswordError('No se pudo conectar con el servidor');
      } else {
        // Algo pasó al configurar la petición
        setPasswordError('Error al verificar la contraseña');
      }
    }
  };
  
  // Cargar configuración al cambiar de plataforma
  useEffect(() => {
    const savedConfig = localStorage.getItem(`crm_${platform}_config`);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (platform === 'whatsapp') {
        setWhatsappConfig(parsed);
      } else {
        setInstagramConfig(parsed);
      }
    }
  }, [platform]);

  // Verificar conexiones de WhatsApp e Instagram
  useEffect(() => {
    const checkConnections = async () => {
      setCheckingConnection(true);
      try {
        const token = Cookies.get('accessToken') || Cookies.get('token');
        
        // Verificar WhatsApp
        try {
          const whatsappRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/status`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setWhatsappConnected(whatsappRes.data.connected || false);
        } catch (error) {
          setWhatsappConnected(false);
        }

        // Verificar Instagram
        try {
          const instagramRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/instagram/status`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setInstagramConnected(instagramRes.data.connected || false);
        } catch (error) {
          setInstagramConnected(false);
        }
      } catch (error) {
        console.error('Error verificando conexiones:', error);
      } finally {
        setCheckingConnection(false);
      }
    };

    checkConnections();
    // Verificar cada 30 segundos
    const interval = setInterval(checkConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessagesRef = useRef<{ [phone: string]: string }>({}); // Trackear último mensaje de cada chat
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTop = useRef(0);

  // Obtener todas las categorías (default + custom), filtrando las ocultas
  const getAllCategories = () => {
    const hidden = JSON.parse(localStorage.getItem('crm_hidden_categories') || '[]');
    const defaultCats = DEFAULT_CATEGORIES.filter(cat => !hidden.includes(cat.value));
    return [...defaultCats, ...customCategories];
  };

  // Cargar categorías personalizadas del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('crm_custom_categories');
    if (saved) {
      try {
        setCustomCategories(JSON.parse(saved));
      } catch (e) {
        console.error('Error cargando categorías:', e);
      }
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [platform]);

  // Filtrar conversaciones
  useEffect(() => {
    let filtered = [...conversations];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(conv =>
        conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.customerPhone.includes(searchTerm) ||
        conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(conv => conv.category === categoryFilter);
    }

    setFilteredConversations(filtered);
  }, [conversations, searchTerm, categoryFilter]);

  // Scroll al último mensaje cuando se abre un chat o llegan mensajes nuevos
  useEffect(() => {
    if (selectedChat) {
      // Pequeño delay para asegurar que el DOM se actualizó
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [selectedChat, conversations]); // Cuando cambia el chat O llegan mensajes nuevos

  // Detectar cuando el usuario hace scroll manualmente
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Calcular si está en el fondo (con margen de 100px)
    const isAtBottom = scrollHeight - currentScrollTop - clientHeight < 100;
    
    // Si está en el fondo, SIEMPRE permitir auto-scroll
    if (isAtBottom) {
      if (isUserScrolling) {
        setIsUserScrolling(false);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    } else {
      // Si NO está en el fondo, el usuario está scrolleando arriba
      if (!isUserScrolling) {
        setIsUserScrolling(true);
      }
      
      // Limpiar timeout anterior
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // NO resetear automáticamente - solo cuando vuelva al fondo
      // Esto evita que se vaya para abajo mientras lees
    }
    
    lastScrollTop.current = currentScrollTop;
  };

  // Normalizar número de teléfono para evitar duplicados
  const normalizePhoneNumber = (phone: string) => {
    // Remover todos los sufijos de WhatsApp
    let normalized = phone.replace(/@s\.whatsapp\.net|@lid|@g\.us|@c\.us/g, '');
    
    // Remover espacios, guiones, paréntesis y otros caracteres NO numéricos
    normalized = normalized.replace(/[\s\-\(\)\.]/g, '');
    
    // Si empieza con +, removerlo
    normalized = normalized.replace(/^\+/, '');
    
    // Asegurar que solo contenga números
    normalized = normalized.replace(/\D/g, '');
    
    // Si el número es muy largo (más de 15 dígitos), es un @lid encriptado - devolver tal cual
    if (normalized.length > 15) {
      return normalized;
    }
    
    // Si es un número argentino válido (empieza con 54 y tiene 12-13 dígitos)
    if (normalized.startsWith('54') && (normalized.length === 12 || normalized.length === 13)) {
      return normalized;
    }
    
    // Si tiene 10-11 dígitos y NO empieza con 54, puede ser un número argentino sin código de país
    if (normalized.length >= 10 && normalized.length <= 11 && !normalized.startsWith('54')) {
      // Agregar código de país argentino
      if (normalized.startsWith('9')) {
        // Ya tiene el 9 de celular
        return '54' + normalized;
      } else {
        // Agregar 54 y 9
        return '549' + normalized;
      }
    }
    
    // Para cualquier otro caso, devolver tal cual (puede ser internacional)
    return normalized;
  };

  const loadConversations = async () => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bot/messages`, {
        params: { platform },
        headers: { Authorization: `Bearer ${token}` },
      });

      const messages = response.data.messages || response.data;
      const grouped: { [key: string]: ChatConversation } = {};

      messages.forEach((msg: any) => {
        // Normalizar el número para evitar duplicados
        const normalizedPhone = normalizePhoneNumber(msg.customerPhone);
        
        if (!grouped[normalizedPhone]) {
          // Si tiene nombre del cliente, usarlo. Si no, verificar si es número válido
          let displayName = normalizedPhone;
          if (msg.customerName && !msg.customerName.startsWith('Cliente')) {
            displayName = cleanClientName(msg.customerName);
          } else {
            // Intentar formatear el número
            const formattedPhone = formatPhoneNumber(normalizedPhone);
            // Si es "Número privado", usar un nombre genérico
            if (formattedPhone === 'Número privado') {
              displayName = `Contacto ${normalizedPhone.substring(0, 8)}`;
            } else {
              displayName = formattedPhone;
            }
          }
          
          grouped[normalizedPhone] = {
            customerPhone: normalizedPhone,
            customerName: displayName,
            originalJid: msg.originalJid || normalizedPhone, // Guardar JID original
            lastMessage: msg.message,
            lastMessageTime: new Date(msg.timestamp),
            messages: [],
            category: msg.category || undefined,
            notes: msg.notes || undefined,
            resolved: msg.resolved || false,
            unreadCount: 0, // Inicializar contador
          };
        }
        
        // Actualizar originalJid si viene uno más reciente
        if (msg.originalJid && !grouped[normalizedPhone].originalJid?.includes('@lid')) {
          grouped[normalizedPhone].originalJid = msg.originalJid;
        }

        // Agregar mensaje del cliente (usar número normalizado) - SOLO si no es [CRM]
        if (msg.message !== '[CRM]') {
          grouped[normalizedPhone].messages.push({
            id: msg.id + '_c',
            message: msg.message,
            timestamp: new Date(msg.timestamp),
            intent: msg.intent,
            isFromCustomer: true,
          });
        }

        // Agregar respuesta del bot si existe
        if (msg.response) {
          // Crear un ID único basado en timestamp y contenido para evitar duplicados
          const responseId = `${msg.id}_b_${msg.timestamp}_${msg.response.substring(0, 20)}`;
          
          grouped[normalizedPhone].messages.push({
            id: responseId,
            message: msg.response,
            timestamp: new Date(msg.timestamp),
            intent: msg.intent,
            isFromCustomer: false,
          });
        }
      });

      // Ordenar mensajes y actualizar último mensaje + contar no leídos
      Object.values(grouped).forEach(conv => {
        conv.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        if (conv.messages.length > 0) {
          const last = conv.messages[conv.messages.length - 1];
          conv.lastMessage = last.message;
          conv.lastMessageTime = last.timestamp;
          
          // Crear un ID único para el último mensaje
          const lastMessageId = `${last.timestamp.getTime()}_${last.isFromCustomer}`;
          const previousLastMessageId = lastMessagesRef.current[conv.customerPhone];
          
          // Si hay un mensaje nuevo del cliente (diferente al anterior), remover del Set de leídos
          if (last.isFromCustomer && lastMessageId !== previousLastMessageId) {
            setReadChats(prev => {
              const newSet = new Set(prev);
              newSet.delete(conv.customerPhone);
              return newSet;
            });
          }
          
          // Actualizar el último mensaje trackeado
          lastMessagesRef.current[conv.customerPhone] = lastMessageId;
          
          // Si el chat está en el Set de leídos O el chat está seleccionado actualmente, mantener en 0
          if (readChats.has(conv.customerPhone) || selectedChat === conv.customerPhone) {
            conv.unreadCount = 0;
          } 
          // Si el último mensaje NO es del cliente, no hay mensajes sin leer
          else if (!last.isFromCustomer) {
            conv.unreadCount = 0;
          }
          // Si el último mensaje ES del cliente, contar mensajes consecutivos
          else {
            let unreadCount = 0;
            for (let i = conv.messages.length - 1; i >= 0; i--) {
              const msg = conv.messages[i];
              if (msg.isFromCustomer) {
                unreadCount++;
              } else {
                break;
              }
            }
            conv.unreadCount = unreadCount;
          }
        }
      });

      const arr = Object.values(grouped).sort((a, b) => 
        b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
      );
      
      setConversations(arr);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error cargando conversaciones:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageToSend = newMessage;
    const now = new Date();
    const tempTimestamp = now.getTime();
    // ID temporal basado en timestamp y contenido
    const tempId = `temp_${tempTimestamp}_${messageToSend.substring(0, 20)}`;
    
    // Limpiar input INMEDIATAMENTE
    setNewMessage('');
    setSending(true);

    // OPTIMISTIC UPDATE: Agregar mensaje a la UI inmediatamente
    setConversations(prev => prev.map(conv => {
      if (conv.customerPhone === selectedChat) {
        return {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: tempId,
              message: messageToSend,
              timestamp: now,
              intent: 'MANUAL_CRM',
              isFromCustomer: false,
            }
          ],
          lastMessage: messageToSend,
          lastMessageTime: now,
        };
      }
      return conv;
    }));

    // Marcar chat como leído inmediatamente
    setReadChats(prev => new Set(prev).add(selectedChat));

    // Scroll inmediato
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    // Liberar el input inmediatamente
    setSending(false);

    // Enviar en segundo plano
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      const selectedConv = conversations.find(c => c.customerPhone === selectedChat);
      const phoneToSend = selectedConv?.originalJid || selectedChat;
      
      const endpoint = platform === 'instagram' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/instagram/send`
        : `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/send`;
      
      const payload = platform === 'instagram'
        ? { recipientId: selectedChat, message: messageToSend }
        : { phone: phoneToSend, message: messageToSend };

      // Enviar mensaje (sin await para no bloquear)
      axios.post(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } })
        .then(response => {
          if (response.data.success) {
            // Guardar en BD en segundo plano
            return axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/bot/messages`,
              {
                customerPhone: selectedChat,
                originalJid: phoneToSend,
                message: '[CRM]',
                response: messageToSend,
                intent: 'MANUAL_CRM',
                status: 'responded',
                platform,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            // NO recargar inmediatamente - el mensaje ya está en la UI con optimistic update
            // Se recargará automáticamente cada 5 segundos de todas formas
          }
        })
        .catch(error => {
          console.error('Error enviando:', error);
          // Si falla, mostrar error pero el mensaje ya está en la UI
          if (!error.response || error.response.status >= 500) {
            alert('Error al enviar mensaje. Intenta de nuevo.');
            // Remover mensaje temporal si falló
            setConversations(prev => prev.map(conv => {
              if (conv.customerPhone === selectedChat) {
                return {
                  ...conv,
                  messages: conv.messages.filter(m => m.id !== tempId)
                };
              }
              return conv;
            }));
          }
        });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateChatCategory = async (phone: string, category: string | null) => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/bot/messages/category`,
        { phone, category: category || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setConversations(prev =>
        prev.map(conv =>
          conv.customerPhone === phone ? { ...conv, category: category || undefined } : conv
        )
      );
    } catch (error) {
      console.error('Error actualizando categoría:', error);
    }
  };

  const addCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const colors = ['bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newCategory = {
      value: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
      label: newCategoryName,
      color: randomColor
    };
    
    const updated = [...customCategories, newCategory];
    setCustomCategories(updated);
    localStorage.setItem('crm_custom_categories', JSON.stringify(updated));
    
    setNewCategoryName('');
    setShowNewCategoryInput(false);
  };

  const deleteCustomCategory = (value: string) => {
    const updated = customCategories.filter(cat => cat.value !== value);
    setCustomCategories(updated);
    localStorage.setItem('crm_custom_categories', JSON.stringify(updated));
    setShowDeleteCategoryConfirm(false);
    setCategoryToDelete(null);
  };

  const hideDefaultCategory = (value: string) => {
    const hidden = JSON.parse(localStorage.getItem('crm_hidden_categories') || '[]');
    hidden.push(value);
    localStorage.setItem('crm_hidden_categories', JSON.stringify(hidden));
    setShowDeleteCategoryConfirm(false);
    setCategoryToDelete(null);
    window.location.reload();
  };

  const handleDeleteCategory = () => {
    if (!categoryToDelete) return;
    
    if (categoryToDelete.isCustom) {
      deleteCustomCategory(categoryToDelete.value);
    } else {
      hideDefaultCategory(categoryToDelete.value);
    }
  };

  const toggleResolved = async (phone: string) => {
    const conv = conversations.find(c => c.customerPhone === phone);
    if (!conv) return;

    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/bot/messages/resolved`,
        { phone, resolved: !conv.resolved },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setConversations(prev =>
        prev.map(c =>
          c.customerPhone === phone ? { ...c, resolved: !c.resolved } : c
        )
      );
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const saveNotes = async (phone: string, notes: string) => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/bot/messages/notes`,
        { phone, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setConversations(prev =>
        prev.map(conv =>
          conv.customerPhone === phone ? { ...conv, notes } : conv
        )
      );
      setEditingNotes(false);
    } catch (error) {
      console.error('Error guardando notas:', error);
    }
  };

  const selectedConv = conversations.find((c) => c.customerPhone === selectedChat);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  };

  // Formatear fecha para separadores (estilo WhatsApp)
  const formatDateSeparator = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return 'Hoy';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  // Verificar si dos fechas son del mismo día
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    const cat = getAllCategories().find(c => c.value === category);
    if (!cat) return null;
    return (
      <Badge className={`${cat.color} text-white text-xs`}>
        {cat.label}
      </Badge>
    );
  };

  // Limpiar nombre del cliente (remover sufijos de WhatsApp)
  const cleanClientName = (name: string) => {
    return name
      .replace(/@s\.whatsapp\.net/g, '')
      .replace(/@lid/g, '')
      .replace(/@g\.us/g, '')
      .replace(/\.net/g, '')
      .trim();
  };

  // Formatear número de teléfono para mostrar de forma legible
  const formatPhoneNumber = (phone: string) => {
    // Limpiar el número primero
    const cleaned = phone.replace(/@s\.whatsapp\.net|@lid|@g\.us|@c\.us/g, '').replace(/\D/g, '');
    
    // Si el número es muy largo (más de 15 dígitos), es un @lid encriptado
    if (cleaned.length > 15) {
      return `Contacto ${cleaned.substring(0, 8)}...`;
    }
    
    // Si es un número argentino (empieza con 54 y tiene 12-13 dígitos)
    if (cleaned.startsWith('54') && (cleaned.length === 12 || cleaned.length === 13)) {
      // Formato: 5491138514845 (13 dígitos) -> +54 9 11 3851-4845
      const country = '54';
      const rest = cleaned.substring(2); // Quitar el 54
      
      if (rest.startsWith('9') && rest.length >= 10) {
        // Tiene el 9 de celular
        const nine = '9';
        const area = rest.substring(1, 3); // Código de área (11, 221, etc)
        const number = rest.substring(3); // El resto del número
        
        // Dividir el número en dos partes
        const half = Math.floor(number.length / 2);
        const first = number.substring(0, half);
        const second = number.substring(half);
        
        return `+${country} ${nine} ${area} ${first}-${second}`;
      }
    }
    
    // Si tiene 10-15 dígitos, mostrar con + al inicio (número internacional)
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      // Formatear como número internacional genérico
      if (cleaned.length === 13) {
        // Formato: +XX XXX XXX XXXX
        return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
      }
      return `+${cleaned}`;
    }
    
    // Si no cumple ningún patrón, mostrar como contacto genérico
    return `Contacto ${cleaned.substring(0, 8)}`;
  };

  // Copiar número de teléfono al portapapeles
  const copyPhoneNumber = async (phone: string) => {
    const formatted = formatPhoneNumber(phone);
    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch (error) {
      console.error('Error copiando número:', error);
    }
  };

  // Guardar nombre del cliente
  const saveClientName = async (phone: string, newName: string) => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      
      // Si el nombre está vacío, eliminar el nombre y volver al número
      const finalName = newName.trim() || null;
      const displayName = finalName || formatPhoneNumber(phone);
      
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/bot/messages/client-name`,
        { phone, name: finalName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setConversations(prev =>
        prev.map(conv =>
          conv.customerPhone === phone ? { ...conv, customerName: displayName } : conv
        )
      );
      setEditingClientName(false);
    } catch (error) {
      console.error('Error guardando nombre del cliente:', error);
      alert('Error al guardar el nombre del cliente');
    }
  };

  // Eliminar chat
  const deleteChat = async (phone: string) => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      
      console.log('🗑️ Eliminando chat:', phone);
      
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/bot/messages/${encodeURIComponent(phone)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Respuesta del servidor:', response.data);
      
      // Remover de la lista local
      setConversations(prev => prev.filter(conv => conv.customerPhone !== phone));
      
      // Si era el chat seleccionado, deseleccionar
      if (selectedChat === phone) {
        setSelectedChat(null);
      }
    } catch (error: any) {
      console.error('❌ Error eliminando chat:', error);
      console.error('Detalles:', error.response?.data);
      alert('Error al eliminar el chat: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="h-full flex flex-col -mx-4">
      {/* Header con selector de plataforma */}
      <div className="px-4 py-3 border-b bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold dark:text-zinc-100">CRM Multi-Plataforma</h1>
        </div>
        
        {/* Selector de Plataforma */}
        <div className="flex items-center gap-2">
          <Button
            variant={platform === 'whatsapp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPlatform('whatsapp')}
            className={`flex items-center gap-2 ${platform === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            <WhatsAppIcon />
            WhatsApp
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 cursor-not-allowed"
          >
            <Instagram className="w-4 h-4" />
            Instagram
          </Button>
        </div>
      </div>

      <Tabs defaultValue="chats" className="h-full">
        <div className="px-4 py-2 border-b bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800">
          <TabsList>
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chats" className="flex-1 flex h-full m-0">
          {platform === 'instagram' ? (
            /* Vista de Instagram */
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-zinc-900 dark:to-zinc-900">
              <div className="text-center p-8 max-w-md">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <Instagram className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2 dark:text-zinc-100">Instagram Direct Messages</h2>
                {checkingConnection ? (
                  <p className="text-gray-600 dark:text-zinc-400 mb-4">Verificando conexión...</p>
                ) : instagramConnected ? (
                  <>
                    <p className="text-gray-600 dark:text-zinc-400 mb-4">Tu cuenta de Instagram está conectada</p>
                    <Badge className="bg-green-500 text-white mb-4">Conectado</Badge>
                    <p className="text-sm text-gray-500 dark:text-zinc-500">Los mensajes aparecerán aquí cuando lleguen</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 dark:text-zinc-400 mb-4">
                      Para gestionar tus mensajes de Instagram, primero debes vincular tu cuenta
                    </p>
                    <Button
                      onClick={() => window.open('/ajustes/integraciones', '_blank')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Vincular Instagram
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-4">
                      Ve a Configuración → Integraciones para conectar tu cuenta
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : !whatsappConnected && !checkingConnection ? (
            /* WhatsApp no conectado */
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-zinc-900 dark:to-zinc-900">
              <div className="text-center p-8 max-w-md">
                <div className="w-24 h-24 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
                  <WhatsAppIcon />
                </div>
                <h2 className="text-2xl font-bold mb-2 dark:text-zinc-100">WhatsApp Business</h2>
                <p className="text-gray-600 dark:text-zinc-400 mb-4">
                  Para gestionar tus mensajes de WhatsApp, primero debes vincular tu cuenta
                </p>
                <Button
                  onClick={() => window.location.href = '/ajustes/integraciones'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Ir a Integraciones
                </Button>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-4">
                  Conectá tu WhatsApp desde Ajustes → Integraciones
                </p>
              </div>
            </div>
          ) : (
            /* Vista de WhatsApp */
            <>
          {/* Lista de chats */}
          <div className="w-80 border-r bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col">
            <div className="p-3 space-y-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Buscar chat..." 
                  className="h-9 pl-9" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {getAllCategories().map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => {
                    setLoading(true);
                    loadConversations();
                  }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Actualizar
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-zinc-400">Cargando...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-zinc-400">
                  {searchTerm || categoryFilter !== 'all' ? 'No hay chats que coincidan' : 'No hay chats'}
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.customerPhone}
                    onClick={() => {
                      setSelectedChat(conv.customerPhone);
                      setIsUserScrolling(false); // Reset scroll al cambiar de chat
                      // Marcar chat como leído
                      setReadChats(prev => new Set(prev).add(conv.customerPhone));
                      // Actualizar el contador inmediatamente
                      setConversations(prev =>
                        prev.map(c =>
                          c.customerPhone === conv.customerPhone
                            ? { ...c, unreadCount: 0 }
                            : c
                        )
                      );
                    }}
                    className={`p-3 border-b dark:border-zinc-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${
                      selectedChat === conv.customerPhone ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                        {conv.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate dark:text-zinc-100">{conv.customerName}</span>
                            {conv.resolved && <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-zinc-400">{formatTime(conv.lastMessageTime)}</span>
                            {(conv.unreadCount ?? 0) > 0 && (
                              <div className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                                {conv.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm text-gray-600 dark:text-zinc-400 truncate ${conv.unreadCount && conv.unreadCount > 0 ? 'font-semibold text-gray-900 dark:text-zinc-100' : ''}`}>
                          {conv.lastMessage}
                        </p>
                        {conv.category && (
                          <div className="mt-1">
                            {getCategoryBadge(conv.category)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900">
            {selectedConv ? (
              <>
                <div className="p-3 bg-gray-100 dark:bg-zinc-800 border-b dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold shrink-0">
                      {selectedConv.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingClientName ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={tempClientName}
                            onChange={(e) => setTempClientName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveClientName(selectedConv.customerPhone, tempClientName);
                              } else if (e.key === 'Escape') {
                                setEditingClientName(false);
                              }
                            }}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0"
                            onClick={() => saveClientName(selectedConv.customerPhone, tempClientName)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingClientName(false)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="font-medium flex items-center gap-2">
                          <span className="truncate">{selectedConv.customerName}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 shrink-0"
                            onClick={() => {
                              setEditingClientName(true);
                              setTempClientName(selectedConv.customerName);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          {selectedConv.resolved && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                        </div>
                      )}
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{formatPhoneNumber(selectedConv.customerPhone)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={() => copyPhoneNumber(selectedConv.customerPhone)}
                          title="Copiar número"
                        >
                          {copiedPhone ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingNotes(true);
                        setTempNotes(selectedConv.notes || '');
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar notas
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleResolved(selectedConv.customerPhone)}>
                        {selectedConv.resolved ? (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Marcar como pendiente
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar como resuelto
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="focus:bg-transparent"
                      >
                        <div className="flex items-center gap-1 w-full">
                          <Tag className="w-4 h-4 shrink-0" />
                          <Select
                            value={selectedConv.category || 'none'}
                            onValueChange={(value) => {
                              if (value === 'none') {
                                updateChatCategory(selectedConv.customerPhone, null);
                              } else if (value === 'new') {
                                setShowNewCategoryInput(true);
                              } else {
                                updateChatCategory(selectedConv.customerPhone, value);
                              }
                            }}
                          >
                            <SelectTrigger className="h-6 border-0 focus:ring-0 flex-1 p-0">
                              <span className="text-sm ml-0.5">
                                {selectedConv.category 
                                  ? getAllCategories().find(c => c.value === selectedConv.category)?.label || 'Sin categoría'
                                  : 'Sin categoría'
                                }
                              </span>
                            </SelectTrigger>
                            <SelectContent className="min-w-[200px]">
                              <SelectItem value="none">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                                  <span className="text-gray-500 italic">Sin categoría</span>
                                </div>
                              </SelectItem>
                              {getAllCategories().map(cat => (
                                <div 
                                  key={cat.value}
                                  className="relative flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer group"
                                  onClick={() => updateChatCategory(selectedConv.customerPhone, cat.value)}
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className={`w-3 h-3 rounded-full ${cat.color} shrink-0`} />
                                    <span>{cat.label}</span>
                                    {selectedConv.category === cat.value && (
                                      <CheckCircle className="w-3.5 h-3.5 text-blue-500 ml-auto" />
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const isCustom = customCategories.find(c => c.value === cat.value);
                                      setCategoryToDelete({
                                        value: cat.value,
                                        label: cat.label,
                                        isCustom: !!isCustom
                                      });
                                      setShowDeleteCategoryConfirm(true);
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded p-1 transition-colors shrink-0 ml-2"
                                    title="Eliminar categoría"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <SelectItem value="new">
                                <div className="flex items-center gap-2 text-blue-500">
                                  <Edit className="w-3 h-3" />
                                  <span>Nueva categoría...</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/30"
                        onClick={() => {
                          setChatToDelete({ phone: selectedConv.customerPhone, name: selectedConv.customerName });
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Notas */}
                {(editingNotes || selectedConv.notes) && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border-b dark:border-zinc-700">
                    {editingNotes ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="Agregar notas..."
                          className="flex-1 h-8 text-sm"
                        />
                        <Button size="sm" onClick={() => saveNotes(selectedConv.customerPhone, tempNotes)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <p className="text-sm flex-1">{selectedConv.notes}</p>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditingNotes(true);
                          setTempNotes(selectedConv.notes || '');
                        }}>
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Mensajes */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-zinc-900 max-h-[calc(100vh-300px)]"
                >
                  {selectedConv.messages.map((msg, index) => {
                    // Verificar si necesitamos mostrar separador de fecha
                    const showDateSeparator = index === 0 || !isSameDay(
                      msg.timestamp,
                      selectedConv.messages[index - 1].timestamp
                    );

                    return (
                      <div key={msg.id}>
                        {/* Separador de fecha */}
                        {showDateSeparator && (
                          <div className="flex justify-center my-4">
                            <div className="bg-white dark:bg-zinc-800 px-3 py-1 rounded-lg shadow-sm">
                              <span className="text-xs text-gray-600 dark:text-zinc-400 font-medium">
                                {formatDateSeparator(msg.timestamp)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Mensaje */}
                        <div className={`flex ${msg.isFromCustomer ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[70%] rounded-lg px-3 py-2 ${msg.isFromCustomer ? 'bg-white dark:bg-zinc-800' : 'bg-[#dcf8c6] dark:bg-green-800'}`}>
                            <p className="text-sm whitespace-pre-wrap dark:text-zinc-100">{msg.message}</p>
                            <span className="text-[10px] text-gray-500 dark:text-zinc-400 float-right mt-1">
                              {msg.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de mensaje */}
                <div className="p-3 bg-gray-100 dark:bg-zinc-800 border-t dark:border-zinc-700 flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Escribí un mensaje..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() || sending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="text-gray-500 dark:text-zinc-400">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-zinc-600" />
                  <p>Seleccioná un chat</p>
                </div>
              </div>
            )}
          </div>
          </>
          )}
        </TabsContent>

        <TabsContent value="stats" className="flex-1 p-4 bg-gray-50 dark:bg-zinc-900 h-full overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow dark:shadow-zinc-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-zinc-400">Total Chats</span>
                <MessageCircle className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold dark:text-zinc-100">{conversations.length}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Conversaciones activas</p>
            </div>
            
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow dark:shadow-zinc-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-zinc-400">Pendientes</span>
                <Clock className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold dark:text-zinc-100">{conversations.filter(c => !c.resolved).length}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Sin resolver</p>
            </div>
            
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow dark:shadow-zinc-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-zinc-400">Chats Hoy</span>
                <MessageCircle className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold dark:text-zinc-100">
                {conversations.filter(conv => {
                  const today = new Date().setHours(0, 0, 0, 0);
                  return conv.messages.some(m => 
                    new Date(m.timestamp).setHours(0, 0, 0, 0) === today
                  );
                }).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Chats únicos hoy</p>
            </div>
            
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow dark:shadow-zinc-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-zinc-400">Mensajes Hoy</span>
                <Send className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold dark:text-zinc-100">
                {conversations.reduce((sum, conv) => {
                  const today = new Date().setHours(0, 0, 0, 0);
                  return sum + conv.messages.filter(m => 
                    new Date(m.timestamp).setHours(0, 0, 0, 0) === today
                  ).length;
                }, 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Últimas 24h</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow dark:shadow-zinc-900">
              <h3 className="font-semibold mb-4 dark:text-zinc-100">Chats por Categoría</h3>
              <div className="space-y-3">
                {getAllCategories().map(cat => {
                  const count = conversations.filter(c => c.category === cat.value).length;
                  const percentage = conversations.length > 0 
                    ? Math.round((count / conversations.length) * 100) 
                    : 0;
                  if (count === 0) return null; // No mostrar categorías sin chats
                  return (
                    <div key={cat.value}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{cat.label}</span>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                        <div 
                          className={`${cat.color} h-2 rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow dark:shadow-zinc-900">
              <h3 className="font-semibold mb-4 dark:text-zinc-100">Actividad Reciente</h3>
              <div className="space-y-3">
                {conversations.slice(0, 5).map(conv => (
                  <div key={conv.customerPhone} className="flex items-center gap-3 pb-3 border-b dark:border-zinc-700 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                      {conv.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.customerName}</p>
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatTime(conv.lastMessageTime)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="config" className="flex-1 p-4 bg-gray-50 dark:bg-zinc-900 h-full overflow-auto">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Configuración de Plataformas */}
            {platform === 'whatsapp' && (
              <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow dark:shadow-zinc-900">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-zinc-100">
                  <WhatsAppIcon />
                  Configuración de WhatsApp
                </h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                  Gestiona la conexión de tu cuenta de WhatsApp Business
                </p>
                <Button
                  onClick={() => window.open('/ajustes/integraciones', '_blank')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Abrir Configuración de WhatsApp
                </Button>
              </div>
            )}
            
            {platform === 'instagram' && (
              <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow dark:shadow-zinc-900">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-zinc-100">
                  <Instagram className="w-5 h-5" />
                  Configuración de Instagram
                </h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                  Gestiona la conexión de tu cuenta de Instagram Business
                </p>
                <Button
                  onClick={() => window.open('/ajustes/integraciones', '_blank')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Abrir Configuración de Instagram
                </Button>
              </div>
            )}
            
            {/* Canales de Broadcast */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow dark:shadow-zinc-900">
              <BroadcastChannels />
            </div>

            {/* Fotos de Productos - ACCESO RÁPIDO */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow dark:shadow-zinc-900">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-zinc-100">
                <Camera className="w-5 h-5" />
                Fotos de Productos
              </h3>
              <ProductPhotosSettings />
            </div>

            {/* Gestión de Categorías */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow dark:shadow-zinc-900">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-zinc-100">
                <Tag className="w-5 h-5" />
                Gestión de Categorías
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  Administra las categorías disponibles para organizar tus chats
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {getAllCategories().map(cat => (
                    <div key={cat.value} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-700 rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                        <span className="text-sm font-medium dark:text-zinc-100">{cat.label}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          onClick={() => {
                            setEditingCategory(cat);
                            setNewCategoryName(cat.label);
                            setNewCategoryColor(cat.color);
                            setShowNewCategoryInput(true);
                          }}
                        >
                          <Palette className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                          onClick={() => {
                            const isCustom = customCategories.find(c => c.value === cat.value);
                            setCategoryToDelete({
                              value: cat.value,
                              label: cat.label,
                              isCustom: !!isCustom
                            });
                            setShowDeleteCategoryConfirm(true);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategoryName('');
                    setNewCategoryColor('bg-blue-500');
                    setShowNewCategoryInput(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Nueva Categoría
                </Button>
              </div>
            </div>

            {/* Estado del Asistente - Solo visible para planes con bot */}
            {hasBot && (
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow dark:shadow-zinc-900">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 dark:text-zinc-100">
                    <Settings className="w-5 h-5" />
                    Estado del Asistente
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Controla si el asistente responde automáticamente</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${currentConfig.botActive ? 'text-green-600' : 'text-gray-400'}`}>
                    {currentConfig.botActive ? 'Activo' : 'Pausado'}
                  </span>
                  <Button
                    variant={currentConfig.botActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleBotToggle}
                    className={currentConfig.botActive ? 'bg-green-600 hover:bg-green-700' : ''}
                    disabled={!isAdmin}
                  >
                    {currentConfig.botActive ? 'Pausar Asistente' : 'Activar Asistente'}
                  </Button>
                </div>
              </div>
              {!isAdmin && (
                <div className="p-3 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded text-sm text-gray-600 dark:text-zinc-300">
                  ℹ Solo los administradores pueden pausar el asistente
                </div>
              )}
              {currentConfig.botActive && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-400">
                  ✓ El asistente está respondiendo automáticamente a los mensajes
                </div>
              )}
              {!currentConfig.botActive && isAdmin && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-700 dark:text-yellow-400">
                  ⚠ El asistente está pausado. Los mensajes no recibirán respuesta automática
                </div>
              )}
            </div>
            )}

          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para verificar contraseña */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => {
        setShowPasswordDialog(open);
        if (!open) {
          setPasswordInput('');
          setPasswordError('');
          setPendingBotAction(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificación de Seguridad</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Para {pendingBotAction === 'pause' ? 'pausar' : 'activar'} el asistente, ingresa tu contraseña de administrador:
            </p>
            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && passwordInput) {
                    verifyPasswordAndToggleBot();
                  }
                }}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-red-600 mt-2">⚠️ {passwordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordDialog(false);
              setPasswordInput('');
              setPasswordError('');
              setPendingBotAction(null);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={verifyPasswordAndToggleBot}
              disabled={!passwordInput}
              className={pendingBotAction === 'activate' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {pendingBotAction === 'pause' ? 'Pausar Asistente' : 'Activar Asistente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear/editar categoría */}
      <Dialog open={showNewCategoryInput} onOpenChange={(open) => {
        setShowNewCategoryInput(open);
        if (!open) {
          setEditingCategory(null);
          setNewCategoryName('');
          setNewCategoryColor('bg-blue-500');
          setColorWarning('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría Personalizada'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Nombre de la categoría
              </label>
              <Input
                placeholder="Nombre de la categoría..."
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  // Limpiar warning de color al cambiar nombre
                  setColorWarning('');
                }}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_COLORS.map((color) => {
                  const categoryWithColor = getAllCategories().find(
                    c => c.color === color.value && (!editingCategory || c.value !== editingCategory.value)
                  );
                  
                  return (
                    <button
                      key={color.value}
                      onClick={() => {
                        if (categoryWithColor) {
                          setColorWarning(`El color ${color.label} ya está siendo usado por "${categoryWithColor.label}"`);
                        } else {
                          setColorWarning('');
                        }
                        setNewCategoryColor(color.value);
                      }}
                      className={`h-10 rounded-lg ${color.value} transition-all relative ${
                        newCategoryColor === color.value 
                          ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' 
                          : 'hover:scale-105'
                      }`}
                      title={color.label}
                    >
                      {categoryWithColor && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
              {colorWarning && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">⚠️ {colorWarning}</p>
                  <p className="text-xs text-yellow-600 mt-1">¿Deseas usar este color de todas formas?</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewCategoryInput(false);
              setEditingCategory(null);
              setNewCategoryName('');
              setNewCategoryColor('bg-blue-500');
              setColorWarning('');
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                const trimmedName = newCategoryName.trim();
                
                // Validar nombre vacío
                if (!trimmedName) {
                  alert('El nombre de la categoría no puede estar vacío');
                  return;
                }
                
                // Validar nombre duplicado
                const allCategories = getAllCategories();
                const nameExists = allCategories.find(
                  c => c.label.toLowerCase() === trimmedName.toLowerCase() && 
                       (!editingCategory || c.value !== editingCategory.value)
                );
                
                if (nameExists) {
                  alert(`Ya existe una categoría con el nombre "${trimmedName}"`);
                  return;
                }
                
                if (editingCategory) {
                  // Actualizar categoría existente
                  const updated = customCategories.map(c => 
                    c.value === editingCategory.value 
                      ? { ...c, label: trimmedName, color: newCategoryColor }
                      : c
                  );
                  setCustomCategories(updated);
                  localStorage.setItem('crm_custom_categories', JSON.stringify(updated));
                  setShowNewCategoryInput(false);
                  setEditingCategory(null);
                  setNewCategoryName('');
                  setNewCategoryColor('bg-blue-500');
                  setColorWarning('');
                } else {
                  // Crear nueva categoría con color
                  const newCat = {
                    value: trimmedName.toLowerCase().replace(/\s+/g, '_'),
                    label: trimmedName,
                    color: newCategoryColor
                  };
                  const updated = [...customCategories, newCat];
                  setCustomCategories(updated);
                  localStorage.setItem('crm_custom_categories', JSON.stringify(updated));
                  setShowNewCategoryInput(false);
                  setNewCategoryName('');
                  setNewCategoryColor('bg-blue-500');
                  setColorWarning('');
                }
              }} 
              disabled={!newCategoryName.trim()}
            >
              {editingCategory ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación de chat */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <Trash2 className="w-5 h-5" />
              Eliminar Chat
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              ¿Estás seguro de que querés eliminar el chat con{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {chatToDelete?.name}
              </span>
              ?
            </p>
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <AlertDescription className="text-xs text-red-800 dark:text-red-200">
                Esta acción no se puede deshacer. Se eliminarán todos los mensajes y el historial de conversación.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setChatToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (chatToDelete) {
                  await deleteChat(chatToDelete.phone);
                  setShowDeleteConfirm(false);
                  setChatToDelete(null);
                }
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación de categoría */}
      <Dialog open={showDeleteCategoryConfirm} onOpenChange={setShowDeleteCategoryConfirm}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Eliminar Categoría
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-zinc-700 dark:text-zinc-300">
              ¿Estás seguro de que querés eliminar la categoría <span className="font-semibold">"{categoryToDelete?.label}"</span>?
            </p>
            {!categoryToDelete?.isCustom && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                Esta es una categoría por defecto. La podes volver a crear cuando quieras.
              </p>
            )}
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Los chats con esta categoría quedarán sin categoría asignada.
            </p>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteCategoryConfirm(false);
                setCategoryToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main export - checks locale and plan for CRM feature
export default function CRMPage() {
  const { locale } = useTranslation();
  const localeFeatures = getFeaturesForLocale(locale);
  const { canAccess, loading } = usePlan();
  const { role } = useGetUserInfo();
  const isSuperAdmin = role === Role.SuperAdmin;
  
  // CRM only available in Spanish
  if (!localeFeatures.crm) {
    return <CRMDisabledMessage />;
  }
  
  // Check plan access (SuperAdmin always has access)
  if (!loading && !canAccess('crm') && !isSuperAdmin) {
    return <UpgradePrompt feature="CRM" description="El módulo de CRM con gestión de chats y asistente de WhatsApp está disponible en el plan Básico o superior." />;
  }
  
  return <CRMPageContent />;
}
