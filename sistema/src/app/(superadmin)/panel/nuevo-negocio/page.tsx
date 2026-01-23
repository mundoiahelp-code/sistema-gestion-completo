'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Mail,
  User,
  Phone,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

export default function NuevoNegocioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    plan: 'free',
  });

  const getToken = () => Cookies.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName || !formData.ownerName || !formData.email) {
      toast.error('Completá los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      // Crear tenant temporal
      const res = await fetch(`${API}/tenants/create-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          plan: formData.plan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear invitación');
      }

      // Generar link de activación
      const activationLink = `${APP_URL}/activar-cuenta?name=${encodeURIComponent(formData.ownerName)}&email=${encodeURIComponent(formData.email)}`;
      
      setGeneratedLink(activationLink);
      toast.success('¡Link de activación generado!');

      // Limpiar formulario
      setFormData({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        plan: 'free',
      });

    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al generar link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success('Link copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/panel')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Nuevo Negocio
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Creá un link de activación para tu nuevo cliente
          </p>
        </div>

        {/* Formulario */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Datos del Negocio
            </CardTitle>
            <CardDescription>
              Completá la información del nuevo cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre del negocio */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-zinc-500" />
                  Nombre del Negocio *
                </Label>
                <Input
                  id="businessName"
                  placeholder="Mundo Apple"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  required
                  className="h-11"
                />
              </div>

              {/* Nombre del dueño */}
              <div className="space-y-2">
                <Label htmlFor="ownerName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-500" />
                  Nombre del Dueño *
                </Label>
                <Input
                  id="ownerName"
                  placeholder="Nicolas Percio"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  required
                  className="h-11"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nicodelpercio@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-zinc-500" />
                  Teléfono (opcional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+54 11 1234-5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-11"
                />
              </div>

              {/* Plan */}
              <div className="space-y-2">
                <Label htmlFor="plan">Plan Inicial</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(value) => setFormData({ ...formData, plan: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Prueba Gratuita (7 días)</SelectItem>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="pro">Profesional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botón */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Generando link...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5 mr-2" />
                    Generar Link de Activación
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Link Generado */}
        {generatedLink && (
          <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                ¡Link Generado!
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-500">
                Enviá este link a tu cliente para que active su cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Link */}
              <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 font-medium">
                  Link de Activación:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-zinc-100 dark:bg-zinc-900 p-3 rounded border border-zinc-200 dark:border-zinc-700 break-all">
                    {generatedLink}
                  </code>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  📋 Instrucciones para el cliente:
                </p>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Hacer clic en el link de activación</li>
                  <li>Configurar su contraseña</li>
                  <li>Verificar su email con el código de 6 dígitos</li>
                  <li>¡Listo! Ya puede acceder al sistema</li>
                </ol>
              </div>

              {/* Botón para crear otro */}
              <Button
                onClick={() => setGeneratedLink('')}
                variant="outline"
                className="w-full"
              >
                Crear Otro Negocio
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
