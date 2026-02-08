'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error en ventas/crear:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold text-gray-700">Algo salió mal</h2>
      <p className="text-gray-500 text-sm">{error.message}</p>
      <Button onClick={() => reset()}>Intentar de nuevo</Button>
    </div>
  );
}
