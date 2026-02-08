'use client';

import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from '@/i18n/I18nProvider';

interface ReportData {
  totalSales: number;
  totalProfit: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  salesByDay: Array<{ date: string; amount: number }>;
  period: string;
}

interface ExportReportsProps {
  data: ReportData;
}

export default function ExportReports({ data }: ExportReportsProps) {
  const { locale } = useTranslation();
  const isSpanish = locale === 'es';
  const dateLocale = isSpanish ? es : enUS;

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(isSpanish ? 'Reporte de Ventas' : 'Sales Report', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`${isSpanish ? 'Período' : 'Period'}: ${data.period}`, 14, 30);
    doc.text(`${isSpanish ? 'Fecha' : 'Date'}: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}`, 14, 37);
    
    doc.setFontSize(14);
    doc.text(isSpanish ? 'Resumen General' : 'Summary', 14, 50);
    
    doc.setFontSize(11);
    doc.text(`${isSpanish ? 'Ventas Totales' : 'Total Sales'}: ${data.totalSales.toLocaleString()}`, 14, 60);
    doc.text(`${isSpanish ? 'Ganancia Total' : 'Total Profit'}: ${data.totalProfit.toLocaleString()}`, 14, 67);
    doc.text(`${isSpanish ? 'Margen' : 'Margin'}: ${((data.totalProfit / data.totalSales) * 100).toFixed(1)}%`, 14, 74);
    
    doc.setFontSize(14);
    doc.text(isSpanish ? 'Top 5 Productos' : 'Top 5 Products', 14, 90);
    
    autoTable(doc, {
      startY: 95,
      head: [[isSpanish ? 'Producto' : 'Product', isSpanish ? 'Cantidad' : 'Qty', isSpanish ? 'Ingresos' : 'Revenue']],
      body: data.topProducts.map(p => [p.name, p.quantity.toString(), `${p.revenue.toLocaleString()}`]),
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 95;
    doc.setFontSize(14);
    doc.text(isSpanish ? 'Ventas por Día' : 'Sales by Day', 14, finalY + 15);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [[isSpanish ? 'Fecha' : 'Date', isSpanish ? 'Monto' : 'Amount']],
      body: data.salesByDay.map(s => [s.date, `${s.amount.toLocaleString()}`]),
    });
    
    doc.save(`${isSpanish ? 'reporte-ventas' : 'sales-report'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToExcel = () => {
    const summaryData = [
      [isSpanish ? 'Reporte de Ventas' : 'Sales Report'],
      [isSpanish ? 'Período' : 'Period', data.period],
      [isSpanish ? 'Fecha' : 'Date', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: dateLocale })],
      [],
      [isSpanish ? 'Ventas Totales' : 'Total Sales', data.totalSales],
      [isSpanish ? 'Ganancia Total' : 'Total Profit', data.totalProfit],
      [isSpanish ? 'Margen %' : 'Margin %', ((data.totalProfit / data.totalSales) * 100).toFixed(1)],
    ];
    
    const productsData = [
      [isSpanish ? 'Producto' : 'Product', isSpanish ? 'Cantidad' : 'Quantity', isSpanish ? 'Ingresos' : 'Revenue'],
      ...data.topProducts.map(p => [p.name, p.quantity, p.revenue]),
    ];
    
    const salesData = [
      [isSpanish ? 'Fecha' : 'Date', isSpanish ? 'Monto' : 'Amount'],
      ...data.salesByDay.map(s => [s.date, s.amount]),
    ];
    
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    const ws2 = XLSX.utils.aoa_to_sheet(productsData);
    const ws3 = XLSX.utils.aoa_to_sheet(salesData);
    
    XLSX.utils.book_append_sheet(wb, ws1, isSpanish ? 'Resumen' : 'Summary');
    XLSX.utils.book_append_sheet(wb, ws2, isSpanish ? 'Top Productos' : 'Top Products');
    XLSX.utils.book_append_sheet(wb, ws3, isSpanish ? 'Ventas por Día' : 'Sales by Day');
    
    XLSX.writeFile(wb, `${isSpanish ? 'reporte-ventas' : 'sales-report'}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button onClick={exportToPDF} variant="outline" className="text-xs sm:text-sm">
        <FileText className="w-4 h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">{isSpanish ? 'Exportar ' : 'Export '}</span>PDF
      </Button>
      <Button onClick={exportToExcel} variant="outline" className="text-xs sm:text-sm">
        <Download className="w-4 h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">{isSpanish ? 'Exportar ' : 'Export '}</span>Excel
      </Button>
    </div>
  );
}
