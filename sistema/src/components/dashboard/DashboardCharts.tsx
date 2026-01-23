'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  ShoppingCart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Componente para métricas privadas con ojito
function PrivateMetric({ 
  title, 
  value, 
  icon, 
  subtitle, 
  valueClassName = '',
  trend,
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  subtitle: string;
  valueClassName?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {icon}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={() => setVisible(!visible)}
          >
            {visible ? <Eye className="h-4 w-4 text-gray-500" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${valueClassName}`}>
          {visible ? `$${value.toLocaleString()}` : '••••••'}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">{subtitle}</p>
          {trend && (
            <div className={`flex items-center text-xs font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend.value).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para métricas normales
function MetricCard({ 
  title, 
  value, 
  icon, 
  subtitle,
  valueClassName = '',
  trend,
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  subtitle: string;
  valueClassName?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${valueClassName}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">{subtitle}</p>
          {trend && (
            <div className={`flex items-center text-xs font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend.value).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardChartsProps {
  salesData: Array<{ date: string; amount: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  lowStock: Array<{ name: string; stock: number }>;
  totalRevenue: number;
  totalProfit: number;
  monthComparison: { current: number; previous: number; percentage: number };
  isAdmin?: boolean;
}

export default function DashboardCharts({
  salesData,
  topProducts,
  lowStock,
  totalRevenue,
  totalProfit,
  monthComparison,
  isAdmin = false,
}: DashboardChartsProps) {
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className={`grid gap-4 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'}`}>
        {/* Solo mostrar Capital y Ganancias para Admin */}
        {isAdmin && (
          <>
            <PrivateMetric
              title="Capital Total"
              value={totalRevenue}
              icon={<DollarSign className="h-5 w-5 text-blue-600" />}
              subtitle="Ingresos del mes"
              trend={{ value: monthComparison.percentage, isPositive: monthComparison.percentage >= 0 }}
            />

            <PrivateMetric
              title="Ganancias Mes"
              value={totalProfit}
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
              subtitle={`Margen: ${profitMargin}%`}
              valueClassName="text-green-600"
            />
          </>
        )}

        <MetricCard
          title="Productos Vendidos"
          value={topProducts.reduce((sum, p) => sum + p.quantity, 0)}
          icon={<ShoppingCart className="h-5 w-5 text-purple-600" />}
          subtitle="Este mes"
          valueClassName="text-purple-600"
        />

        <MetricCard
          title="Stock Bajo"
          value={lowStock.length}
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
          subtitle="Requieren atención"
          valueClassName={lowStock.length > 0 ? 'text-orange-600' : 'text-gray-600'}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de ventas con área */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Ventas del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 productos con barras horizontales */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Top 5 Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150}
                  stroke="#6b7280" 
                  style={{ fontSize: '11px' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="quantity" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de stock bajo */}
      {lowStock.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {lowStock.map((product, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-lg border border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Package className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">Requiere reposición</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{product.stock}</p>
                    <p className="text-xs text-gray-500">unidades</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
