'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Download, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import Papa from 'papaparse';
import axios from 'axios';
import { API } from '@/config/api';

export default function ImportCSV() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: number } | null>(null);
  const { locale } = useTranslation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        let success = 0;
        let errors = 0;

        for (const row of results.data as any[]) {
          try {
            await axios.post(`${API}/products`, {
              name: row.nombre || 'iPhone',
              model: row.modelo,
              storage: row.almacenamiento,
              color: row.color,
              imei: row.imei,
              price: parseFloat(row.precio),
              cost: parseFloat(row.costo),
              stock: parseInt(row.stock) || 1,
              condition: row.condicion || 'Nuevo',
              description: row.descripcion || '',
            });
            success++;
          } catch (error) {
            console.error('Error importing row:', row, error);
            errors++;
          }
        }

        setResults({ success, errors });
        setLoading(false);
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        setLoading(false);
      },
    });
  };

  const downloadTemplate = () => {
    const template = `modelo,almacenamiento,color,imei,precio,costo,stock,condicion,descripcion
iPhone 15 Pro,256GB,Titanio Negro,123456789012345,1200000,1000000,1,Nuevo,
iPhone 14,128GB,Azul,123456789012346,800000,650000,1,Nuevo,`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = locale === 'es' ? 'plantilla_productos.csv' : 'products_template.csv';
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          {locale === 'es' ? 'Importar CSV' : 'Import CSV'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === 'es' ? 'Importar Productos desde CSV' : 'Import Products from CSV'}</DialogTitle>
          <DialogDescription>
            {locale === 'es' 
              ? 'Sube un archivo CSV con tus productos para importarlos masivamente'
              : 'Upload a CSV file with your products to import them in bulk'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            {locale === 'es' ? 'Descargar Plantilla CSV' : 'Download CSV Template'}
          </Button>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {file ? file.name : (locale === 'es' ? 'Click para seleccionar archivo CSV' : 'Click to select CSV file')}
              </p>
            </label>
          </div>

          {file && !results && (
            <Button onClick={handleImport} disabled={loading} className="w-full">
              {loading ? (locale === 'es' ? 'Importando...' : 'Importing...') : (locale === 'es' ? 'Importar Productos' : 'Import Products')}
            </Button>
          )}

          {results && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>{results.success} {locale === 'es' ? 'productos importados correctamente' : 'products imported successfully'}</span>
              </div>
              {results.errors > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span>{results.errors} {locale === 'es' ? 'productos con errores' : 'products with errors'}</span>
                </div>
              )}
              <Button onClick={() => { setFile(null); setResults(null); }} className="w-full mt-4">
                {locale === 'es' ? 'Importar Otro Archivo' : 'Import Another File'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
