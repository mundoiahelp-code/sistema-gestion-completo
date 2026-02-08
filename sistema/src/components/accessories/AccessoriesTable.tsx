'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  CopyIcon,
  SearchIcon,
  InfoIcon,
  ShoppingCartIcon,
  LoaderCircleIcon,
  Edit2Icon,
  Trash2Icon,
  AlertTriangleIcon,
  PlusIcon,
  MinusIcon,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { useRouter } from 'next/navigation';
import useSonner from '@/hooks/useSonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from '@/i18n/I18nProvider';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface Props {
  data: any[];
}

// Componente Info del accesorio con reservas múltiples y traslado
function AccessoryInfo({ item, onUpdate }: { item: any; onUpdate: () => void }) {
  const { t } = useTranslation();
  const { handleSuccessSonner, handleErrorSonner } = useSonner();
  const [loading, setLoading] = useState(false);
  const [showReserveInput, setShowReserveInput] = useState(false);
  const [showTransferInput, setShowTransferInput] = useState(false);
  const [reserveQty, setReserveQty] = useState(1);
  const [transferQty, setTransferQty] = useState(1);
  const [targetStoreId, setTargetStoreId] = useState('');
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const reserved = item.reserved || 0;
  const stock = item.stock || 0;
  const available = stock - reserved;
  const stockByStore = item.stockByStore || [];

  const infoItems = [
    { name: t('common.name'), value: item.name },
    { name: t('products.model'), value: item.model || '-' },
    { name: t('products.stock'), value: stock },
    { name: t('accessories.reserved'), value: reserved, highlight: reserved > 0 },
    { name: t('accessories.available'), value: available },
    { name: t('common.price'), value: `$${item.price?.toLocaleString()}` },
    { name: t('products.cost'), value: `$${item.cost?.toLocaleString() || 0}` },
  ];

  const fetchStores = async () => {
    setLoadingStores(true);
    try {
      const token = Cookies.get('accessToken');
      const res = await axios.get(`${API}/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allStores = res.data.stores || res.data || [];
      const otherStores = allStores.filter((s: any) => s.id !== item.storeId);
      setStores(otherStores);
      if (otherStores.length > 0) setTargetStoreId(otherStores[0].id);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoadingStores(false);
    }
  };

  const handleReserve = async (newReserved: number) => {
    setLoading(true);
    try {
      const token = Cookies.get('accessToken');
      await axios.patch(`${API}/products/${item.id}`, { reserved: newReserved }, { headers: { Authorization: `Bearer ${token}` } });
      handleSuccessSonner(t('notifications.updated'));
      setShowReserveInput(false);
      onUpdate();
    } catch (error) {
      handleErrorSonner(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddReserve = () => {
    const newTotal = Math.min(reserved + reserveQty, stock);
    handleReserve(newTotal);
  };

  const handleTransfer = async () => {
    if (!targetStoreId) return;
    setLoading(true);
    try {
      const token = Cookies.get('accessToken');
      await axios.post(`${API}/products/transfer`, { productId: item.id, targetStoreId, quantity: transferQty }, { headers: { Authorization: `Bearer ${token}` } });
      handleSuccessSonner(t('accessories.transferSuccess'));
      setShowTransferInput(false);
      onUpdate();
    } catch (error) {
      handleErrorSonner(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const openTransfer = () => {
    setTransferQty(1);
    fetchStores();
    setShowTransferInput(true);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <InfoIcon className="stroke-1 h-5 w-5 cursor-pointer hover:opacity-80" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('common.info')}
            {reserved > 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{reserved} {t('accessories.reservedShort')}</span>}
          </DialogTitle>
        </DialogHeader>
        <div>
          <ul className="space-y-2">
            {infoItems.map((info, i) => (
              <li key={i} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{info.name}</span>
                <span className={twMerge('font-medium', info.highlight && 'text-green-600')}>{info.value}</span>
              </li>
            ))}
          </ul>

          {stockByStore.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold mb-2">{t('accessories.stockByStore')}:</p>
              <div className="space-y-1">
                {stockByStore.map((store: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-zinc-800 px-3 py-2 rounded">
                    <span className="font-medium">{store.storeName}</span>
                    <div className="flex gap-3">
                      <span className="text-green-600">{store.stock} {t('products.units')}</span>
                      {store.reserved > 0 && <span className="text-orange-500">({store.reserved} res.)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección de traslado */}
          {!showTransferInput ? (
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full" onClick={openTransfer} disabled={stock === 0}>
                {t('accessories.transferToStore')}
              </Button>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t space-y-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm font-semibold">{t('accessories.transferToStore')}</p>
              {loadingStores ? (
                <div className="flex justify-center py-2"><LoaderCircleIcon className="h-5 w-5 animate-spin" /></div>
              ) : stores.length === 0 ? (
                <p className="text-sm text-gray-500">{t('accessories.noOtherStores')}</p>
              ) : (
                <>
                  <div>
                    <Label className="text-sm">{t('accessories.targetStore')}</Label>
                    <Select value={targetStoreId} onValueChange={setTargetStoreId}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {stores.map((store) => (<SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-sm whitespace-nowrap">{t('common.quantity')}:</Label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTransferQty(Math.max(1, transferQty - 1))}>-</Button>
                      <Input type="number" min={1} max={stock} value={transferQty} onChange={(e) => setTransferQty(Math.max(1, Math.min(+e.target.value, stock)))} className="w-16 h-8 text-center" />
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTransferQty(Math.min(stock, transferQty + 1))}>+</Button>
                    </div>
                    <span className="text-xs text-gray-500">de {stock}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowTransferInput(false)} className="flex-1">{t('common.cancel')}</Button>
                    <Button size="sm" onClick={handleTransfer} disabled={loading || !targetStoreId} className="flex-1">
                      {loading ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : t('accessories.transfer')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Sección de reservas */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">{t('accessories.manageReserves')}</p>
              {reserved > 0 && (
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-7 text-xs" onClick={() => handleReserve(0)} disabled={loading}>
                  {t('accessories.clearAll')}
                </Button>
              )}
            </div>
            
            {!showReserveInput ? (
              <div className="flex gap-2">
                {available > 1 ? (
                  <Button onClick={() => { setReserveQty(1); setShowReserveInput(true); }} disabled={available === 0} className="flex-1 bg-green-600 hover:bg-green-700">
                    <PlusIcon className="h-4 w-4 mr-1" />{t('products.reserve')}
                  </Button>
                ) : (
                  <Button onClick={() => handleReserve(reserved + 1)} disabled={available === 0 || loading} className="flex-1 bg-green-600 hover:bg-green-700">
                    {loading ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <><PlusIcon className="h-4 w-4 mr-1" />{t('products.reserve')}</>}
                  </Button>
                )}
                {reserved > 0 && (
                  <Button onClick={() => handleReserve(reserved - 1)} disabled={loading} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                    <MinusIcon className="h-4 w-4 mr-1" />{t('accessories.removeOne')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <Label className="text-sm whitespace-nowrap">{t('common.quantity')}:</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setReserveQty(Math.max(1, reserveQty - 1))}>-</Button>
                    <Input type="number" min={1} max={available} value={reserveQty} onChange={(e) => setReserveQty(Math.max(1, Math.min(+e.target.value, available)))} className="w-16 h-8 text-center" />
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setReserveQty(Math.min(available, reserveQty + 1))}>+</Button>
                  </div>
                  <span className="text-xs text-gray-500">de {available}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowReserveInput(false)} className="flex-1">{t('common.cancel')}</Button>
                  <Button size="sm" onClick={handleAddReserve} disabled={loading || reserveQty === 0} className="flex-1 bg-green-600 hover:bg-green-700">
                    {loading ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : <>{t('products.reserve')} {reserveQty}</>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// Componente para editar accesorio
function EditAccessoryDialog({ item, onUpdate }: { item: any; onUpdate: () => void }) {
  const { t } = useTranslation();
  const { handleSuccessSonner, handleErrorSonner } = useSonner();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    name: item.name || '',
    model: item.model || '',
    price: item.price?.toString() || '',
    cost: item.cost?.toString() || '',
    stock: item.stock?.toString() || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('accessToken');
      await axios.put(`${API}/products/${item.id}`, { name: form.name, model: form.model, price: +form.price, cost: +form.cost, stock: +form.stock }, { headers: { Authorization: `Bearer ${token}` } });
      handleSuccessSonner(t('notifications.updated'));
      setOpen(false);
      onUpdate();
    } catch (error) {
      handleErrorSonner(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const token = Cookies.get('accessToken');
      await axios.delete(`${API}/products/${item.id}`, { headers: { Authorization: `Bearer ${token}` } });
      handleSuccessSonner(t('notifications.deleted'));
      setShowDeleteConfirm(false);
      setOpen(false);
      onUpdate();
    } catch (error) {
      handleErrorSonner(t('errors.generic'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Edit2Icon className="h-4 w-4 text-gray-500 hover:text-blue-500" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editAccessory.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('editAccessory.name')}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>{t('editAccessory.model')}</Label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{t('editAccessory.price')}</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <Label>{t('editAccessory.cost')}</Label>
                <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
              <div>
                <Label>{t('editAccessory.stock')}</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between mt-4">
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2Icon className="h-4 w-4 mr-1" />{t('common.delete')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : t('common.save')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-500" />{t('accessories.deleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('accessories.deleteConfirm').replace('{name}', item.name)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600" disabled={deleteLoading}>
              {deleteLoading ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AccessoriesTable({ data }: Props) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { handleSuccessSonner } = useSonner();
  const [search, setSearch] = useState('');
  const [showSellDialog, setShowSellDialog] = useState<any>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [showReservedAlert, setShowReservedAlert] = useState<any>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const filteredData = data.filter((item) => {
    const searchLower = search.toLowerCase();
    return item.name?.toLowerCase().includes(searchLower) || item.model?.toLowerCase().includes(searchLower);
  });

  const handleCopyStock = () => {
    const text = filteredData.map((item) => `${item.name} - Stock: ${item.stock} - ${item.price?.toLocaleString()}`).join('\n');
    navigator.clipboard.writeText(text);
    handleSuccessSonner(t('notifications.copied'));
  };

  const handleQuickSell = (item: any) => {
    if (item.reserved > 0) {
      setShowReservedAlert(item);
    } else {
      openSellDialog(item);
    }
  };

  const openSellDialog = (item: any) => {
    setSellQuantity(1);
    const stores = item.stockByStore || [];
    setSelectedStore(stores.length > 0 ? stores[0] : null);
    setShowSellDialog(item);
  };

  const proceedToSell = () => {
    if (!showSellDialog) return;
    const itemWithQty = { ...showSellDialog, quantity: sellQuantity, selectedStoreId: selectedStore?.storeId, selectedStoreName: selectedStore?.storeName };
    localStorage.setItem('quickSellAccessory', JSON.stringify(itemWithQty));
    router.push('/ventas/crear');
  };

  const handleUpdate = () => router.refresh();

  const totalStock = filteredData.reduce((sum, item) => sum + (item.stock || 0), 0);
  const totalReserved = filteredData.reduce((sum, item) => sum + (item.reserved || 0), 0);

  // Exportar a Excel
  const handleExportExcel = () => {
    setExportLoading(true);
    try {
      const excelData = filteredData.map((acc) => ({
        'Nombre': acc.name || '',
        'Modelo': acc.model || '',
        'Stock Total': acc.stock || 0,
        'Reservados': acc.reserved || 0,
        'Disponibles': (acc.stock || 0) - (acc.reserved || 0),
        'Precio': acc.price || 0,
        'Costo': acc.cost || 0,
        'Stock por Sucursal': acc.stockByStore?.map((s: any) => `${s.storeName}: ${s.stock}`).join(', ') || ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar anchos
      ws['!cols'] = [
        { wch: 30 }, // Nombre
        { wch: 20 }, // Modelo
        { wch: 12 }, // Stock Total
        { wch: 12 }, // Reservados
        { wch: 12 }, // Disponibles
        { wch: 12 }, // Precio
        { wch: 12 }, // Costo
        { wch: 40 }  // Stock por Sucursal
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Accesorios');
      
      const filename = `accesorios_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`${filteredData.length} accesorios exportados`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div>
      <div className="w-full my-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex gap-4 text-xs sm:text-sm">
          <p className="font-medium">{t('products.units')}: {totalStock}</p>
          <p className="font-medium">{t('products.reserved')}: <span className="text-green-600">{totalReserved}</span></p>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {locale === 'es' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleExportExcel}
              disabled={exportLoading || filteredData.length === 0}
            >
              {exportLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-1">Excel</span>
            </Button>
          )}
          <Button size="sm" onClick={handleCopyStock}>
            <CopyIcon className="stroke-1 h-4 w-4" />
            <span className="hidden sm:inline ml-1">{t('products.copyList')}</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-2 items-center mb-4">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder={t('products.searchAccessory')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setSearch('')} disabled={!search}>{t('common.all')}</Button>
      </div>

      {filteredData.length > 0 ? (
        <div className="rounded-md border bg-white dark:bg-zinc-900 dark:border-zinc-800 md:overflow-visible overflow-x-auto">
          <Table className="w-full md:min-w-0 min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">{t('common.name')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('products.model')}</TableHead>
                <TableHead className="text-center whitespace-nowrap">{t('products.stock')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('accessories.stockByStore')}</TableHead>
                <TableHead className="text-center whitespace-nowrap">{t('accessories.reserved')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('common.price')}</TableHead>
                <TableHead><span className="sr-only">info</span></TableHead>
                <TableHead><span className="sr-only">{t('products.sell')}</span></TableHead>
                <TableHead><span className="sr-only">{t('common.edit')}</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => {
                const reserved = item.reserved || 0;
                const hasReserved = reserved > 0;
                const textColor = hasReserved ? 'text-green-500' : '';
                return (
                  <TableRow key={item.id} className={hasReserved ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                    <TableCell className={twMerge('font-medium', textColor)}>{item.name}</TableCell>
                    <TableCell className={twMerge('text-gray-600', textColor)}>{item.model || '-'}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded text-sm ${item.stock > 5 ? 'bg-green-100 text-green-700' : item.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{item.stock}</span>
                    </TableCell>
                    <TableCell>
                      {item.stockByStore && item.stockByStore.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.stockByStore.map((store: any, i: number) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded whitespace-nowrap">{store.stock} {store.storeName.substring(0, 3)}</span>
                          ))}
                        </div>
                      ) : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {reserved > 0 ? <span className="px-2 py-1 rounded text-sm bg-green-200 text-green-800">{reserved}</span> : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell className={twMerge('text-green-700 font-semibold whitespace-nowrap', hasReserved && 'text-green-500')}>${item.price?.toLocaleString()}</TableCell>
                    <TableCell><AccessoryInfo item={item} onUpdate={handleUpdate} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => handleQuickSell(item)} title={t('products.sell')}>
                        <ShoppingCartIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell><EditAccessoryDialog item={item} onUpdate={handleUpdate} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="w-full text-center py-8 bg-white dark:bg-zinc-900 rounded-md border">
          <p className="text-gray-500">{t('products.noAccessories')}</p>
        </div>
      )}

      <Dialog open={!!showSellDialog} onOpenChange={(open) => !open && setShowSellDialog(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader><DialogTitle>{t('accessories.sellAccessory')}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">{showSellDialog?.name}</p>
            {showSellDialog?.stockByStore && showSellDialog.stockByStore.length > 1 && (
              <div>
                <Label className="text-sm">{t('accessories.selectStore')}</Label>
                <Select value={selectedStore?.storeId || ''} onValueChange={(val) => { const store = showSellDialog.stockByStore.find((s: any) => s.storeId === val); setSelectedStore(store); if (store && sellQuantity > store.stock) setSellQuantity(store.stock); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {showSellDialog.stockByStore.map((store: any) => (<SelectItem key={store.storeId} value={store.storeId}>{store.storeName} ({store.stock} {t('accessories.availableShort')})</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-sm">{t('common.quantity')}</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input type="number" min={1} max={selectedStore?.stock || showSellDialog?.stock || 1} value={sellQuantity} onChange={(e) => setSellQuantity(Math.max(1, Math.min(+e.target.value, selectedStore?.stock || showSellDialog?.stock)))} className="w-20" />
                <span className="text-sm text-gray-500">de {selectedStore?.stock || showSellDialog?.stock} {t('accessories.availableShort')}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSellDialog(null)}>{t('common.cancel')}</Button>
            <Button onClick={proceedToSell}>{t('accessories.sell')} {sellQuantity}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!showReservedAlert} onOpenChange={(open) => !open && setShowReservedAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('products.reservedProduct')}</AlertDialogTitle>
            <AlertDialogDescription>{t('products.reservedSellConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { openSellDialog(showReservedAlert); setShowReservedAlert(null); }}>{t('products.continueSale')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
