'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
  data: { month: string; total: number; count: number }[];
}

export default function SalesGraph({ data }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const { t, locale } = useTranslation();
  const isEnglish = locale === 'en';

  useEffect(() => {
    const token = Cookies.get('accessToken') || Cookies.get('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(payload.role === 'ADMIN' || payload.role === 'SUPERADMIN');
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, [data]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthsES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = isEnglish ? monthsEN : monthsES;
    return months[parseInt(month) - 1] || monthStr;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 shadow-lg">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatMonth(item.month)}</p>
              <p className="text-xl font-bold text-blue-600">{item.count}</p>
            </div>
            {isAdmin && item.total > 0 && (
              <div className="pl-3 border-l border-zinc-200 dark:border-zinc-700">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isEnglish ? 'Revenue' : 'Facturación'}
                </p>
                <p className="text-sm font-bold text-green-600">${(item.total / 1000).toFixed(0)}k</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className='w-full'>
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg">
          {isEnglish ? 'Sales' : 'Ventas'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={formatMonth}
              />
              <YAxis 
                hide
                domain={[0, 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="count"
                stroke="#9ca3af" 
                strokeWidth={2}
                dot={{ fill: '#9ca3af', r: 3 }}
                activeDot={{ r: 5, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
