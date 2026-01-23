'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  message: string;
  response: string;
  createdAt: string;
  customerName?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  customerPhone: string;
  customerName: string;
}

export default function ConversationModal({ open, onClose, customerPhone, customerName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open && customerPhone) {
      fetchMessages();
    }
  }, [open, customerPhone]);

  useEffect(() => {
    // Scroll al final cuando se cargan los mensajes
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/bot/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 }
        }
      );

      // Filtrar mensajes de este cliente y ordenar del más antiguo al más reciente
      const clientMessages = (response.data.messages || [])
        .filter((msg: any) => msg.customerPhone.includes(customerPhone.slice(-10)))
        .reverse(); // Invertir para que los más antiguos estén arriba

      setMessages(clientMessages);
    } catch (error) {
      console.error('Error cargando conversación:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Fecha inválida';
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      if (d.toDateString() === today.toDateString()) {
        return `Hoy ${time}`;
      } else if (d.toDateString() === yesterday.toDateString()) {
        return `Ayer ${time}`;
      } else {
        return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${time}`;
      }
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversación con {customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          {loading ? (
            <div className="text-center py-8 text-zinc-500">Cargando conversación...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No hay mensajes de este cliente
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {/* Mensaje del cliente */}
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 shadow-sm">
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 ml-1">{formatDate(msg.createdAt)}</p>
                    </div>
                  </div>

                  {/* Respuesta del bot */}
                  {msg.response && (
                    <div className="flex items-start gap-2 ml-10">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 shadow-sm">
                          <p className="text-sm whitespace-pre-wrap">{msg.response}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {/* Elemento invisible para hacer scroll */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
