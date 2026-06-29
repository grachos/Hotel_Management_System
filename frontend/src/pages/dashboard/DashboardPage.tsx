import { useState, useEffect } from 'react';
import { dashboardApi } from '../../services/api';
import { DashboardResumen } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import {
  DollarSign, TrendingUp, BedDouble, ClipboardList,
  AlertTriangle, Users, ShoppingCart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg p-3 text-sm">
        <p className="text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-bold text-slate-800 dark:text-slate-100" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'Ventas' ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResumen | null>(null);
  const [ventas, setVentas] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.resumen(),
      dashboardApi.ventas(15),
      dashboardApi.alertas(),
    ]).then(([res, ventasRes, alertasRes]) => {
      setData(res.data.data);
      setVentas(ventasRes.data.data || []);
      setAlertas(alertasRes.data.data || []);
    }).catch((err) => {
      console.error('Dashboard API error:', err);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Cargando datos del panel...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <div className="card p-12">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Sin datos disponibles</h3>
          <p className="text-slate-500 mb-4">No se pudieron obtener los datos del panel</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Reintentar</button>
        </div>
      </div>
    );
  }

  const ventasModuloColors = ['#2563eb', '#7c3aed', '#0d9488'];
  const ventasModuloData = (data.ventasModulo || []).map((v: any, i: number) => ({
    name: v.modulo,
    value: parseFloat(v.total_ventas) || 0,
    color: ventasModuloColors[i],
  }));

  const ocupacionPorcentaje = data.ocupacion.habitaciones_totales > 0
    ? Math.round((data.ocupacion.habitaciones_ocupadas / data.ocupacion.habitaciones_totales) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 fade-in">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard Ejecutivo</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ingresos Hoy"
          value={formatCurrency(data.ventasHoy)}
          icon={<DollarSign size={22} />}
          subtitle="Ventas del día"
          iconBg="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Ventas del Mes"
          value={formatCurrency(data.ventasMes)}
          icon={<TrendingUp size={22} />}
          subtitle="Acumulado mensual"
          iconBg="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
        />
        <StatCard
          title="Ocupación"
          value={`${ocupacionPorcentaje}%`}
          icon={<BedDouble size={22} />}
          subtitle={`${data.ocupacion.habitaciones_ocupadas} de ${data.ocupacion.habitaciones_totales} habitaciones`}
          iconBg="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Huéspedes Activos"
          value={data.huespedesActivos}
          icon={<Users size={22} />}
          subtitle="Check-ins activos"
          iconBg="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos (Últimos 15 días)</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventas}>
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('es', { day: '2-digit', month: '2-digit' })}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              <CardTitle>Stock Crítico</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {data.stockBajo > 0 ? (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {data.stockBajo} producto(s) por debajo del stock mínimo
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Todo el inventario está en niveles óptimos.</p>
            )}
            <hr className="border-slate-100 dark:border-slate-700" />
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-brand-600" />
                <span className="text-sm text-slate-600 dark:text-slate-300">Pedidos Pendientes</span>
              </div>
              <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{data.pedidosPendientes}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-brand-600" />
                <span className="text-sm text-slate-600 dark:text-slate-300">Ventas por Módulo</span>
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ventasModuloData.length ? ventasModuloData : [{ name: 'Sin datos', value: 1, color: '#e2e8f0' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    dataKey="value"
                  >
                    {ventasModuloData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4">
              {ventasModuloData.map((v: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />
                  {v.name}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {(data.topProductos || []).slice(0, 5).map((prod: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-400 w-6">{i + 1}.</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{prod.nombre}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{prod.total_vendido}</p>
                  <p className="text-xs text-slate-400">{formatCurrency(prod.total_ingresos)}</p>
                </div>
              </div>
            ))}
            {(!data.topProductos || !data.topProductos.length) && (
              <p className="text-sm text-slate-400 text-center py-4">Sin ventas este mes</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas Recientes</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {alertas.slice(0, 5).map((alerta: any) => (
              <div key={alerta.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600">
                <div className={`p-1.5 rounded-lg ${
                  alerta.tipo === 'Stock' ? 'bg-red-100 text-red-600' :
                  alerta.tipo === 'Reservacion' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{alerta.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{alerta.mensaje}</p>
                  <p className="text-2xs text-slate-400 mt-1">{formatDateTime(alerta.created_at)}</p>
                </div>
                <Badge variant={alerta.tipo === 'Stock' ? 'danger' : 'info'}>{alerta.tipo}</Badge>
              </div>
            ))}
            {!alertas.length && (
              <p className="text-sm text-slate-400 text-center py-4">Sin alertas recientes</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
