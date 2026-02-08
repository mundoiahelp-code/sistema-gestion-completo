'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { useTranslation } from '@/i18n/I18nProvider';
import { translateColor } from '@/helpers/translateColor';

interface ProductQRProps {
  product: {
    id: string;
    model: string;
    storage: string;
    color: string;
    imei: string;
    price: number;
  };
}

export default function ProductQR({ product }: ProductQRProps) {
  const { locale } = useTranslation();
  const isSpanish = locale === 'es';
  const [open, setOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  const generateQR = async () => {
    const productData = JSON.stringify({
      id: product.id,
      model: product.model,
      storage: product.storage,
      color: product.color,
      imei: product.imei,
      price: product.price,
    });

    try {
      const url = await QRCode.toDataURL(productData, {
        width: 300,
        margin: 2,
      });
      setQrUrl(url);
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      generateQR();
    }
  };

  const downloadQR = () => {
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR_${product.imei}.png`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSpanish ? 'Código QR del Producto' : 'Product QR Code'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <p className="font-semibold">{product.model}</p>
            <p className="text-sm text-gray-600">
              {product.storage} - {translateColor(product.color, locale)}
            </p>
            <p className="text-xs text-gray-500">IMEI: {product.imei}</p>
          </div>
          
          {qrUrl && (
            <div className="flex flex-col items-center gap-4">
              <img src={qrUrl} alt="QR Code" className="border rounded-lg" />
              <Button onClick={downloadQR} className="w-full">
                {isSpanish ? 'Descargar QR' : 'Download QR'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
