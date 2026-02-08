'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, Package, TrendingUp, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { format, differenceInMonths } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from '@/i18n/I18nProvider';

interface ClientDetailsProps {
  clientId: string;
  open: boolean;
  onClose: () => void;
}

export default function ClientDetails({ clientId, open, onClose }: ClientDetailsProps) {
  const { t, locale } = useTranslation();
  const [client, setClient] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dateLocale = locale === 'es' ? es : enUS;

  useEffect(() => {
    if (open && clientId) {
      fetchClientData();
    }
  }, [open, clientId]);

  const fetchClientData = async () => {
    try {
      const token = Cookies.get('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [clientRes, salesRes] = await Promise.all([
        axios.get(`${API}/clients/${clientId}`, { headers }),
        axios.get(`${API}/sales?clientId=${clientId}`, { headers }),
      ]);

      setClient(clientRes.data.client || clientRes.data);
      setPurchases(salesRes.data.sales || []);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !client) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <p>{t('common.loading')}</p>
        </DialogContent>
      </Dialog>
    );
  }

  const totalSpent = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
  const lastPurchase = purchases[0]?.createdAt ? new Date(purchases[0].createdAt) : null;
  const monthsSinceLastPurchase = lastPurchase ? differenceInMonths(new Date(), lastPurchase) : null;
  const needsFollowUp = client.type === 'wholesale' && monthsSinceLastPurchase && monthsSinceLastPurchase >= 6;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {client.name}
            <Badge variant={client.type === 'wholesale' ? 'default' : 'secondary'}>
              {client.type === 'wholesale' ? t('clientDetails.wholesale') : t('clientDetails.retail')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Alertas */}
        {needsFollowUp && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-800">{t('clientDetails.followUpRecommended')}</p>
              <p className="text-sm text-orange-700">
                {t('clientDetails.monthsSinceLastPurchase').replace('{months}', String(monthsSinceLastPurchase))}
              </p>
            </div>
          </div>
        )}

        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('clientDetails.totalSpent')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('clientDetails.totalPurchases')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchases.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('clientDetails.lastPurchase')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {lastPurchase ? format(lastPurchase, 'dd/MM/yyyy', { locale: dateLocale }) : t('clientDetails.noPurchases')}
              </div>
              {monthsSinceLastPurchase !== null && (
                <p className="text-xs text-muted-foreground">
                  {t('clientDetails.monthsAgo').replace('{months}', String(monthsSinceLastPurchase))}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="purchases" className="w-full">
          <TabsList>
            <TabsTrigger value="purchases">{t('clientDetails.purchaseHistory')}</TabsTrigger>
            <TabsTrigger value="info">{t('clientDetails.information')}</TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="space-y-4">
            {purchases.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{t('clientDetails.noPurchasesRecorded')}</p>
            ) : (
              purchases.map((purchase, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {format(new Date(purchase.createdAt), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
                        </p>
                        <div className="mt-2 space-y-1">
                          {purchase.items?.map((item: any, i: number) => (
                            <p key={i} className="text-sm text-gray-600">
                              • {item.product?.model} {item.product?.storage} {item.product?.color}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${purchase.total?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{purchase.payment?.[0]?.type || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t('clientDetails.idNumber')}</p>
                    <p className="font-semibold">{client.dni || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('clientDetails.phone')}</p>
                    <p className="font-semibold">{client.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('clientDetails.email')}</p>
                    <p className="font-semibold">{client.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('clientDetails.address')}</p>
                    <p className="font-semibold">{client.address || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
