'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API } from '@/config/api';
import { useTranslation } from '@/i18n/I18nProvider';

interface CashSession {
  id: string;
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
  expenses: Array<{ description: string; amount: number }>;
  sales: number;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
}

export default function CashRegister() {
  const { t } = useTranslation();
  const [session, setSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  useEffect(() => {
    fetchCurrentSession();
  }, []);

  const fetchCurrentSession = async () => {
    try {
      const res = await axios.get(`${API}/cash-register/current`);
      setSession(res.data);
    } catch (error) {
      console.log(t('cashRegister.noActiveSession'));
    }
  };

  const handleOpenCash = async () => {
    if (!openingAmount) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/cash-register/open`, {
        openingAmount: parseFloat(openingAmount),
      });
      setSession(res.data);
      setOpeningAmount('');
    } catch (error) {
      console.error('Error opening cash:', error);
      alert(t('cashRegister.errorOpening'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCash = async () => {
    if (!closingAmount || !session) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/cash-register/close/${session.id}`, {
        closingAmount: parseFloat(closingAmount),
      });
      setSession(res.data);
      setClosingAmount('');
    } catch (error) {
      console.error('Error closing cash:', error);
      alert(t('cashRegister.errorClosing'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseDescription || !expenseAmount || !session) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/cash-register/expense/${session.id}`, {
        description: expenseDescription,
        amount: parseFloat(expenseAmount),
      });
      setSession(res.data);
      setExpenseDescription('');
      setExpenseAmount('');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert(t('cashRegister.errorAddingExpense'));
    } finally {
      setLoading(false);
    }
  };

  if (!session || session.status === 'closed') {
    return (
      <div className="p-3 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t('cashRegister.title')}</h1>
        <Card className="max-w-md">
          <CardHeader className="px-4 md:px-6">
            <CardTitle className="text-lg md:text-xl">{t('cashRegister.openRegister')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 md:px-6">
            <div>
              <Label className="text-sm">{t('cashRegister.openingAmount')}</Label>
              <Input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="0"
                className="text-lg"
              />
            </div>
            <Button onClick={handleOpenCash} disabled={loading} className="w-full">
              {loading ? t('cashRegister.opening') : t('cashRegister.openRegister')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalExpenses = session.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expectedAmount = session.openingAmount + session.sales - totalExpenses;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">{t('cashRegister.title')}</h1>

      {/* Resumen */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">{t('cashRegister.initial')}</CardTitle>
            <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-lg md:text-2xl font-bold">${session.openingAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">{t('cashRegister.sales')}</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-green-600">+${session.sales.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">{t('cashRegister.expenses')}</CardTitle>
            <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-red-600">-${totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">{t('cashRegister.expected')}</CardTitle>
            <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-lg md:text-2xl font-bold">${expectedAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gastos */}
      <Card>
        <CardHeader className="px-3 md:px-6">
          <CardTitle className="text-lg md:text-xl">{t('cashRegister.registerExpense')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <Label className="text-sm">{t('cashRegister.description')}</Label>
              <Input
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder={t('cashRegister.descriptionPlaceholder')}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">{t('cashRegister.amount')}</Label>
              <Input
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0"
                className="text-sm"
              />
            </div>
          </div>
          <Button onClick={handleAddExpense} disabled={loading} className="w-full sm:w-auto">
            {t('cashRegister.addExpense')}
          </Button>

          {session.expenses.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold text-sm md:text-base">{t('cashRegister.todayExpenses')}</h3>
              {session.expenses.map((expense, index) => (
                <div key={index} className="flex justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded text-sm">
                  <span className="truncate mr-2 dark:text-zinc-200">{expense.description}</span>
                  <span className="font-semibold text-red-600 whitespace-nowrap">-${expense.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cerrar Caja */}
      <Card>
        <CardHeader className="px-3 md:px-6">
          <CardTitle className="text-lg md:text-xl">{t('cashRegister.closeRegister')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3 md:px-6">
          <div>
            <Label className="text-sm">{t('cashRegister.actualAmount')}</Label>
            <Input
              type="number"
              value={closingAmount}
              onChange={(e) => setClosingAmount(e.target.value)}
              placeholder="0"
              className="text-lg"
            />
          </div>
          {closingAmount && (
            <div className="p-3 md:p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg text-sm md:text-base">
              <div className="flex justify-between mb-2">
                <span className="dark:text-zinc-300">{t('cashRegister.expectedLabel')}</span>
                <span className="font-semibold dark:text-zinc-100">${expectedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="dark:text-zinc-300">{t('cashRegister.actualLabel')}</span>
                <span className="font-semibold dark:text-zinc-100">${parseFloat(closingAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base md:text-lg font-bold border-t dark:border-zinc-700 pt-2">
                <span>{t('cashRegister.difference')}</span>
                <span className={parseFloat(closingAmount) - expectedAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {parseFloat(closingAmount) - expectedAmount >= 0 ? '+' : ''}
                  ${(parseFloat(closingAmount) - expectedAmount).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          <Button onClick={handleCloseCash} disabled={loading || !closingAmount} className="w-full">
            {loading ? t('cashRegister.closing') : t('cashRegister.closeRegister')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
