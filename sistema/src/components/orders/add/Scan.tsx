'use client';

import { useEffect, useRef } from 'react';

interface Props {
  addOne: (imei: string) => void;
}

export default function Scan({ addOne }: Props) {
  const barcodeRef = useRef('');

  useEffect(() => {
    const handleScan = (e: KeyboardEvent) => {
      const { code, key } = e;
      if (code.includes('Digit')) {
        barcodeRef.current += key;

        if (barcodeRef.current.length === 1) {
          setTimeout(() => (barcodeRef.current = ''), 300);
        }
      }
      if (barcodeRef.current.length === 15) {
        addOne(barcodeRef.current);
        barcodeRef.current = '';
      }
    };

    document.body.addEventListener('keypress', handleScan);

    return () => {
      document.body.removeEventListener('keypress', handleScan);
    };
  }, [addOne]);

  return null;
}
