'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PencilIcon, CopyIcon, CheckIcon, XIcon } from 'lucide-react';
import useSonner from '@/hooks/useSonner';
import { useTranslation } from '@/i18n/I18nProvider';

interface PriceList {
  retail: string;
  wholesale: string;
  retailUpdatedAt: string;
  wholesaleUpdatedAt: string;
}

export default function Content() {
  const { t, locale } = useTranslation();
  const { handleSuccessSonner } = useSonner();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('retail');
  const [lists, setLists] = useState<PriceList>({
    retail: '',
    wholesale: '',
    retailUpdatedAt: '',
    wholesaleUpdatedAt: '',
  });
  const [editText, setEditText] = useState('');

  // Cargar listas desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('priceLists');
    if (saved) {
      setLists(JSON.parse(saved));
    }
  }, []);

  const handleEdit = () => {
    setEditText(activeTab === 'retail' ? lists.retail : lists.wholesale);
    setEditMode(true);
  };

  const handleSave = () => {
    const listField = activeTab === 'retail' ? 'retail' : 'wholesale';
    const dateField = activeTab === 'retail' ? 'retailUpdatedAt' : 'wholesaleUpdatedAt';
    const updated = {
      ...lists,
      [listField]: editText,
      [dateField]: new Date().toISOString(),
    };
    setLists(updated);
    localStorage.setItem('priceLists', JSON.stringify(updated));
    setEditMode(false);
    handleSuccessSonner(t('lists.listSaved'));
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditText('');
  };

  const handleCopy = () => {
    const text = activeTab === 'retail' ? lists.retail : lists.wholesale;
    if (text) {
      navigator.clipboard.writeText(text);
      handleSuccessSonner(t('lists.listCopied'));
    }
  };

  const currentList = activeTab === 'retail' ? lists.retail : lists.wholesale;
  const dateLocaleStr = locale === 'es' ? 'es-AR' : 'en-US';

  return (
    <Card className="bg-white dark:bg-zinc-900 rounded-lg w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">{t('lists.wholesaleList')}</CardTitle>
            {(activeTab === 'retail' ? lists.retailUpdatedAt : lists.wholesaleUpdatedAt) && (
              <CardDescription className="text-xs">
                {t('lists.updated')} {new Date(activeTab === 'retail' ? lists.retailUpdatedAt : lists.wholesaleUpdatedAt).toLocaleDateString(dateLocaleStr, { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-1">
            {!editMode && currentList && (
              <Button variant="ghost" size="icon" onClick={handleCopy} title={t('lists.copy')}>
                <CopyIcon className="h-4 w-4" />
              </Button>
            )}
            {!editMode ? (
              <Button variant="ghost" size="icon" onClick={handleEdit} title={t('lists.edit')}>
                <PencilIcon className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={handleSave} title={t('lists.save')}>
                  <CheckIcon className="h-4 w-4 text-green-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancel} title={t('lists.cancel')}>
                  <XIcon className="h-4 w-4 text-red-500" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setEditMode(false); }}>
          <TabsList className="w-full mb-3">
            <TabsTrigger value="retail" className="flex-1">{t('lists.iphones')}</TabsTrigger>
            <TabsTrigger value="wholesale" className="flex-1">{t('lists.accessories')}</TabsTrigger>
          </TabsList>

          <TabsContent value="retail">
            {editMode ? (
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder={t('lists.iphonePlaceholder')}
                className="min-h-[200px] text-sm"
              />
            ) : (
              <div className="min-h-[100px] text-sm whitespace-pre-wrap text-gray-700">
                {lists.retail || (
                  <span className="text-gray-400 italic">
                    {t('lists.noList')}
                  </span>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wholesale">
            {editMode ? (
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder={t('lists.accessoriesPlaceholder')}
                className="min-h-[200px] text-sm"
              />
            ) : (
              <div className="min-h-[100px] text-sm whitespace-pre-wrap text-gray-700">
                {lists.wholesale || (
                  <span className="text-gray-400 italic">
                    {t('lists.noList')}
                  </span>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
