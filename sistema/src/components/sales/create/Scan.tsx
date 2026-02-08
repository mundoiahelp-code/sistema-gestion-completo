'use client';

import { useEffect, useRef } from 'react';

interface Prop {
  handleAddItem: (imei: string) => void;
  loading: boolean;
}

export default function Scan({ handleAddItem, loading }: Prop) {
  const barcodeRef = useRef('');

  useEffect(() => {
    const handleScan = (e: KeyboardEvent) => {
      if (loading) return;
      const { code, key } = e;
      if (code.includes('Digit')) {
        barcodeRef.current += key;

        if (barcodeRef.current.length === 1) {
          setTimeout(() => (barcodeRef.current = ''), 300);
        }
      }
      if (barcodeRef.current.length === 15) {
        handleAddItem(barcodeRef.current);
        barcodeRef.current = '';
      }
    };

    document.body.addEventListener('keypress', handleScan);

    return () => {
      document.body.removeEventListener('keypress', handleScan);
    };
  }, [handleAddItem, loading]);

  return null;
}
