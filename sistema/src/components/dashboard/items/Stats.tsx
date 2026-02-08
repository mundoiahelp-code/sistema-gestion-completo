'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ArrowLeftRight } from 'lucide-react';
import { Role } from '@/enums/role.enum';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  capitalIphones: number;
  capitalAccessories: number;
  earningsUSD: number;
  earningsARS: number;
}

export default function Stats({ capitalIphones, capitalAccessories, earningsUSD, earningsARS }: Props) {
  const { t, locale } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [earningsCurrency, setEarningsCurrency] = useState<'USD' | 'ARS'>('USD');

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const role = user?.role || '';
        setIsAdmin(role === 'ADMIN' || role === Role.Admin);
      }
    } catch (e) {
      console.error('Error reading user from localStorage');
    }
    setIsLoaded(true);
  }, []);
  
  if (!isLoaded) return null;
  if (!isAdmin) return null;

  const monthsEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const months = locale === 'es' ? monthsEs : monthsEn;
  const currentMonth = months[new Date().getMonth()];
  const formatNumber = (num: number) => parseFloat('' + num).toLocaleString(locale === 'es' ? 'es-AR' : 'en-US');

  // Ganancias del mes
  const earningsValue = earningsCurrency === 'USD' ? earningsUSD : earningsARS;

  return (
    <div className='relative'>
      <Button
        variant="ghost"
        size="sm"
        className="absolute -top-1 right-0 h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-zinc-700 z-10"
        onClick={() => setShowAll(!showAll)}
      >
        {showAll ? (
          <Eye className="h-4 w-4 text-zinc-400" />
        ) : (
          <EyeOff className="h-4 w-4 text-zinc-400" />
        )}
      </Button>
      
      <div className='grid gap-3 pt-6 lg:pt-0'>
        {/* Capital iPhones - USD */}
        <div className='bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-zinc-700/50'>
          <span className={`text-2xl font-bold text-green-600 dark:text-green-400`}>
            {showAll ? `USD ${formatNumber(capitalIphones)}` : '••••••'}
          </span>
          <span className='text-zinc-500 dark:text-zinc-400 text-sm block'>{t('dashboard.phonesCapital')}</span>
        </div>

        {/* Capital Accesorios */}
        <div className='bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-zinc-700/50'>
          <span className={`text-2xl font-bold text-cyan-600 dark:text-cyan-400`}>
            {showAll ? `${locale === 'es' ? 'ARS' : 'USD'} ${formatNumber(capitalAccessories)}` : '••••••'}
          </span>
          <span className='text-zinc-500 dark:text-zinc-400 text-sm block'>{t('dashboard.accessoriesCapital')}</span>
        </div>

        {/* Ganancias con toggle */}
        <div className='bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-zinc-700/50'>
          <div className='flex items-center justify-between mb-1'>
            <span className={`text-2xl font-bold ${
              earningsCurrency === 'USD' ? 'text-green-600 dark:text-green-400' : 'text-cyan-600 dark:text-cyan-400'
            }`}>
              {showAll 
                ? `${earningsCurrency} ${formatNumber(earningsValue)}` 
                : '••••••'
              }
            </span>
            {locale === 'es' && (
              <button
                onClick={() => setEarningsCurrency(earningsCurrency === 'USD' ? 'ARS' : 'USD')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  earningsCurrency === 'USD' 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30' 
                    : 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/30'
                }`}
              >
                <ArrowLeftRight className="h-3 w-3" />
                {earningsCurrency === 'USD' ? 'ARS' : 'USD'}
              </button>
            )}
          </div>
          <span className='text-zinc-500 dark:text-zinc-400 text-sm'>{t('dashboard.monthlyEarnings')} - {currentMonth}</span>
        </div>
      </div>
    </div>
  );
}
