'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Tema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-24 animate-pulse bg-gray-200 rounded-lg' />
        </CardContent>
      </Card>
    );
  }

  const themes = [
    { id: 'light', label: 'Claro', icon: Sun },
    { id: 'dark', label: 'Oscuro', icon: Moon },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Tema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-3'>
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;

            return (
              <Button
                key={t.id}
                onClick={() => setTheme(t.id)}
                variant={isActive ? 'default' : 'outline'}
                className={`h-20 flex flex-col items-center justify-center gap-2 ${
                  isActive ? 'ring-2 ring-offset-2 ring-black dark:ring-white' : ''
                }`}
              >
                <Icon className='w-6 h-6' />
                <span className='text-sm'>{t.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
