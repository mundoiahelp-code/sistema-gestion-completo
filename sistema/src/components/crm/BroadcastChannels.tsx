'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Megaphone, Plus, Trash2, Send, Clock, Edit, RefreshCw, Users
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { usePlan } from '@/hooks/usePlan';

interface BroadcastChannel {
  id: string;
  name: string;
  chatId: string;
  type: 'GROUP' | 'BROADCAST_LIST';
  message?: string;
  sendTime: string;
  sendStock: boolean;
  enabled: boolean;
  lastSent?: string;
}

export default function BroadcastChannels() {
  const { canAccess } = usePlan();
  const hasPro = canAccess('bot'); // Plan Pro tiene bot IA
  
  const [channels, setChannels] = useState<BroadcastChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<BroadcastChannel | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; participants: number }>>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    chatId: '',
    type: 'GROUP' as 'GROUP' | 'BROADCAST_LIST',
    message: '',
    sendTime: '09:00',
    sendStock: true,
    enabled: true,
    frequency: 1, // Cada cuántos días enviar
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      fetchGroups();
    }
  }, [modalOpen]);

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const token = Cookies.get('accessToken') || Cookies.get('token');
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/groups`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups(res.data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Error al cargar grupos. Asegurate de que WhatsApp esté conectado.');
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const token = Cookies.get('token');
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/broadcast/channels`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChannels(res.data.channels || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (channel?: BroadcastChannel) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({
        name: channel.name,
        chatId: channel.chatId,
        type: channel.type,
        message: channel.message || '',
        sendTime: channel.sendTime,
        sendStock: channel.sendStock,
        enabled: channel.enabled,
        frequency: (channel as any).frequency || 1,
      });
    } else {
      setEditingChannel(null);
      setFormData({
        name: '',
        chatId: '',
        type: 'GROUP',
        message: '',
        sendTime: '09:00',
        sendStock: true,
        enabled: true,
        frequency: 1,
      });
    }
    setModalOpen(true);
  };

  const saveChannel = async () => {
    try {
      const token = Cookies.get('token');
      
      if (editingChannel) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/broadcast/channels/${editingChannel.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Canal actualizado');
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/broadcast/channels`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Canal creado');
      }
      
      setModalOpen(false);
      fetchChannels();
    } catch (error) {
      toast.error('Error al guardar canal');
    }
  };

  const deleteChannel = async (id: string) => {
    if (!confirm('¿Eliminar este canal?')) return;
    
    try {
      const token = Cookies.get('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/broadcast/channels/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Canal eliminado');
      fetchChannels();
    } catch (error) {
      toast.error('Error al eliminar canal');
    }
  };

  const sendNow = async (id: string) => {
    setSending(id);
    try {
      const token = Cookies.get('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/broadcast/channels/${id}/send`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Mensaje enviado');
      fetchChannels();
    } catch (error) {
      toast.error('Error al enviar mensaje');
    } finally {
      setSending(null);
    }
  };

  const toggleEnabled = async (channel: BroadcastChannel) => {
    try {
      const token = Cookies.get('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/broadcast/channels/${channel.id}`,
        { enabled: !channel.enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchChannels();
    } catch (error) {
      toast.error('Error al actualizar canal');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2 dark:text-zinc-100">
            <Megaphone className="w-5 h-5" />
            Canales de Broadcast
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            {hasPro 
              ? 'Envía mensajes automáticamente a grupos y listas de difusión'
              : 'Envía mensajes manualmente a grupos y listas de difusión'
            }
          </p>
        </div>
        <Button size="sm" onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay canales configurados</p>
          <p className="text-sm">Agregá grupos o listas de difusión para enviar stock automáticamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`p-4 rounded-lg border ${
                channel.enabled 
                  ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' 
                  : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={channel.enabled}
                    onCheckedChange={() => toggleEnabled(channel)}
                    disabled={!hasPro}
                    title={!hasPro ? 'Solo disponible en Plan Pro' : ''}
                  />
                  <div>
                    <div className="font-medium dark:text-zinc-100 flex items-center gap-2">
                      {channel.name}
                      {!hasPro && <Badge variant="outline" className="text-xs">Manual</Badge>}
                    </div>
                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                      <span className={channel.type === 'GROUP' ? 'text-green-600' : 'text-blue-600'}>
                        {channel.type === 'GROUP' ? '👥 Grupo' : '📢 Lista'}
                      </span>
                      {hasPro && (
                        <>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{channel.sendTime}hs</span>
                          {channel.sendStock && (
                            <>
                              <span>•</span>
                              <span>📱 Stock auto</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    {hasPro && channel.lastSent && (
                      <div className="text-xs text-zinc-400 mt-1">
                        Último envío: {new Date(channel.lastSent).toLocaleString('es-AR')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => sendNow(channel.id)}
                    disabled={sending === channel.id}
                    title="Enviar ahora"
                  >
                    {sending === channel.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openModal(channel)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteChannel(channel.id)}
                    className="text-red-500 hover:text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle>
              {editingChannel ? 'Editar Canal' : 'Nuevo Canal'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Mayoristas, Minoristas..."
                className="mt-1 dark:bg-zinc-800"
              />
            </div>

            <div>
              <Label>Grupo de WhatsApp</Label>
              {loadingGroups ? (
                <div className="mt-1 p-3 border rounded-lg dark:border-zinc-700 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-zinc-400" />
                  <span className="text-sm text-zinc-500">Cargando grupos...</span>
                </div>
              ) : groups.length > 0 ? (
                <Select
                  value={formData.chatId}
                  onValueChange={(v) => setFormData({...formData, chatId: v})}
                >
                  <SelectTrigger className="mt-1 dark:bg-zinc-800">
                    <SelectValue placeholder="Seleccioná un grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.participants} miembros)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1">
                  <Input
                    value={formData.chatId}
                    onChange={(e) => setFormData({...formData, chatId: e.target.value})}
                    placeholder="Ej: 123456789@g.us"
                    className="dark:bg-zinc-800"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    No se encontraron grupos. Asegurate de que WhatsApp esté conectado.
                  </p>
                </div>
              )}
            </div>

            {/* SOLO PLAN PRO: Configuración de envío automático */}
            {hasPro && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v: 'GROUP' | 'BROADCAST_LIST') => setFormData({...formData, type: v})}
                    >
                      <SelectTrigger className="mt-1 dark:bg-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GROUP">👥 Grupo</SelectItem>
                        <SelectItem value="BROADCAST_LIST">📢 Lista de difusión</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Hora de envío</Label>
                    <Input
                      type="time"
                      value={formData.sendTime}
                      onChange={(e) => setFormData({...formData, sendTime: e.target.value})}
                      className="mt-1 dark:bg-zinc-800"
                    />
                  </div>
                </div>

                <div>
                  <Label>Frecuencia de envío</Label>
                  <Select
                    value={formData.frequency.toString()}
                    onValueChange={(v) => setFormData({...formData, frequency: parseInt(v)})}
                  >
                    <SelectTrigger className="mt-1 dark:bg-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Todos los días</SelectItem>
                      <SelectItem value="2">Cada 2 días</SelectItem>
                      <SelectItem value="3">Cada 3 días</SelectItem>
                      <SelectItem value="7">Una vez por semana</SelectItem>
                      <SelectItem value="15">Cada 15 días</SelectItem>
                      <SelectItem value="30">Una vez al mes</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-500 mt-1">
                    El mensaje se enviará cada {formData.frequency} {formData.frequency === 1 ? 'día' : 'días'} a las {formData.sendTime}hs
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <div className="font-medium text-sm dark:text-zinc-100">Enviar stock automático</div>
                    <div className="text-xs text-zinc-500">Incluye lista de productos disponibles</div>
                  </div>
                  <Switch
                    checked={formData.sendStock}
                    onCheckedChange={(v) => setFormData({...formData, sendStock: v})}
                  />
                </div>
              </>
            )}

            <div>
              <Label>Mensaje personalizado {!hasPro && '(opcional)'}</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder={hasPro ? "Usá {stock} para insertar la lista de productos" : "Escribí el mensaje que querés enviar"}
                className="mt-1 dark:bg-zinc-800"
                rows={3}
              />
              {hasPro ? (
                <p className="text-xs text-zinc-500 mt-1">
                  Dejalo vacío para enviar solo el stock, o escribí un mensaje y usá {'{stock}'} donde quieras la lista
                </p>
              ) : (
                <p className="text-xs text-zinc-500 mt-1">
                  Este mensaje se enviará cuando hagas clic en "Enviar ahora"
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveChannel} disabled={!formData.name || !formData.chatId}>
              {editingChannel ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
