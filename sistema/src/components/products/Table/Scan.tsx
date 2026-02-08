'use client';

import { useEffect } from 'react';

interface Props {
  onChange: (value: string) => void;
}

export default function Scan({ onChange }: Props) {
  let barcode = '';

  const handleScan = (e: KeyboardEvent) => {
    const { code, key } = e;
    if (code.includes('Digit')) {
      barcode += key;

      if (barcode.length === 1) {
        setTimeout(() => (barcode = ''), 300);
      }
    }
    if (barcode.length === 15) {
      onChange(barcode);
      barcode = '';
    }
  };

  useEffect(() => {
    document.body.addEventListener('keypress', handleScan);

    return () => {
      document.body.removeEventListener('keypress', handleScan);
    };
  });

  return <></>;
}
