import { useState, useEffect } from 'react';
import { reportsApi } from '../../services/api';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/helpers';
import {
  TrendingUp, DollarSign, ShoppingBag, BedDouble, Users,
  Calendar, Percent, Star, ArrowUpRight, ArrowDownRight,
  ClipboardList, Download, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#7c3aed', '#0d9488', '#f59e0b', '#ef4444', '#ec4899'];
const MODULE_COLORS: Record<string, string> = {
  Restaurante: '#f97316',
  Bar: '#7c3aed',
  MiniMarket: '#0d9488',
};

function KpiCard({ title, value, subtitle, icon, trend, color }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg flex-shrink-0 ${color || 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'}`}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend).toFixed(1)}% vs mes anterior
        </div>
      )}
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-sm">
      <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="font-semibold text-slate-800 dark:text-slate-100" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportesPage() {
  const [data, setData] = useState<any>(null);
  const [trend, setTrend] = useState<any>({ actual: [], anterior: [] });
  const [topProductos, setTopProductos] = useState<any[]>([]);
  const [guestDemo, setGuestDemo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(30);
  const [tab, setTab] = useState<'general' | 'productos' | 'huespedes'>('general');

  useEffect(() => { loadAll(); }, [periodo]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [kpi, tr, prod, demo] = await Promise.all([
        reportsApi.kpiSummary(),
        reportsApi.salesTrend(periodo),
        reportsApi.topProductos(10),
        reportsApi.guestDemographics(),
      ]);
      setData(kpi.data.data);
      setTrend(tr.data.data);
      setTopProductos(prod.data.data);
      setGuestDemo(demo.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const trendData = trend.actual?.map((d: any, i: number) => {
    const anterior = trend.anterior?.[i];
    return {
      fecha: d.fecha,
      actual: parseFloat(d.total) || 0,
      anterior: anterior ? parseFloat(anterior.total) || 0 : 0,
      pedidos: d.pedidos || 0,
    };
  }) || [];

  const totalVentasActual = trendData.reduce((s: number, d: any) => s + d.actual, 0);
  const totalVentasAnterior = trendData.reduce((s: number, d: any) => s + d.anterior, 0);
  const trendPct = totalVentasAnterior > 0 ? ((totalVentasActual - totalVentasAnterior) / totalVentasAnterior) * 100 : 0;

  const modulos = data?.ventasModulo || [];
  const totalModulos = modulos.reduce((s: number, m: any) => s + parseFloat(m.total || 0), 0);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Business Intelligence</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Panel ejecutivo de indicadores clave de rendimiento</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            {[7, 15, 30, 90].map((d) => (
              <button key={d} onClick={() => setPeriodo(d)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${periodo === d ? 'bg-white dark:bg-slate-600 text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{d}d</button>
            ))}
          </div>
          <button onClick={loadAll} className="btn-secondary p-2.5">
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KpiCard title="Ventas Hoy" value={formatCurrency(data?.ventasHoy || 0)} icon={<DollarSign size={18} />} color="bg-green-50 dark:bg-green-900/20 text-green-600" subtitle={`${data?.pedidosHoy || 0} pedidos`} />
        <KpiCard title="Ventas del Mes" value={formatCurrency(data?.ventasMes || 0)} icon={<TrendingUp size={18} />} color="bg-brand-50 dark:bg-brand-900/20 text-brand-600" trend={trendPct} subtitle={`${data?.pedidosMes || 0} pedidos`} />
        <KpiCard title="RevPAR" value={formatCurrency(data?.revpar || 0)} icon={<BedDouble size={18} />} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" subtitle="por hab. disponible" />
        <KpiCard title="ADR" value={formatCurrency(data?.adr || 0)} icon={<Calendar size={18} />} color="bg-purple-50 dark:bg-purple-900/20 text-purple-600" subtitle="tarifa promedio diaria" />
        <KpiCard title="Ocupación" value={`${data?.ocupacion?.porcentaje || 0}%`} icon={<Users size={18} />} color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" subtitle={`${data?.ocupacion?.ocupadas || 0} / ${data?.ocupacion?.total || 0}`} />
        <KpiCard title="Ticket Prom." value={formatCurrency(data?.ticketPromedio || 0)} icon={<ShoppingBag size={18} />} color="bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600" subtitle="por pedido" />
        <KpiCard title="Cancelación" value={`${data?.tasaCancelacion || 0}%`} icon={<Percent size={18} />} color="bg-red-50 dark:bg-red-900/20 text-red-600" subtitle={`estancia: ${data?.estanciaPromedio || 0} días`} />
        <KpiCard title="Satisfacción" value={`${data?.satisfaccion?.rating || 0}`} icon={<Star size={18} />} color="bg-rose-50 dark:bg-rose-900/20 text-rose-600" subtitle={`${data?.satisfaccion?.total || 0} opiniones`} />
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'general', label: 'Ventas & Ocupación' },
          { id: 'productos', label: 'Productos' },
          { id: 'huespedes', label: 'Huéspedes' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Evolución de Ingresos</CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-600" />
                    <span className="text-slate-500">Período actual</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-slate-300" />
                    <span className="text-slate-500">Período anterior</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <div className="h-72">
              {loading ? (
                <div className="animate-pulse h-full bg-slate-100 dark:bg-slate-700 rounded" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient>
                      <linearGradient id="colorAnterior" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} /><stop offset="95%" stopColor="#94a3b8" stopOpacity={0} /></linearGradient>
                    </defs>
                    <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => new Date(v).toLocaleDateString('es', { day: '2-digit', month: 'short' })} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `S/${v}`} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <Tooltip content={<CustomTooltip formatter={(v: number) => formatCurrency(v)} />} />
                    <Area type="monotone" dataKey="anterior" stroke="#94a3b8" fill="url(#colorAnterior)" strokeWidth={2} strokeDasharray="4 4" name="Período anterior" />
                    <Area type="monotone" dataKey="actual" stroke="#2563eb" fill="url(#colorActual)" strokeWidth={2} name="Período actual" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Distribución por Módulo</CardTitle></CardHeader>
              <div className="h-64 flex items-center justify-center">
                {modulos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={modulos.map((m: any) => ({ name: m.modulo, value: parseFloat(m.total) || 0 }))} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                        {modulos.map((_: any, i: number) => <Cell key={i} fill={MODULE_COLORS[_.modulo] || COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip formatter={(v: number) => formatCurrency(v)} />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400">Sin datos este mes</p>
                )}
              </div>
              <div className="flex justify-center gap-6 pb-4">
                {modulos.map((m: any) => (
                  <div key={m.modulo} className="text-center">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: MODULE_COLORS[m.modulo] || '#2563eb' }} />
                      {m.modulo}
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatCurrency(parseFloat(m.total) || 0)}</p>
                    <p className="text-xs text-slate-400">{totalModulos > 0 ? ((parseFloat(m.total) / totalModulos) * 100).toFixed(1) : 0}%</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Resumen de Ocupación</CardTitle></CardHeader>
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Habitaciones</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {data?.ocupacion?.ocupadas || 0} de {data?.ocupacion?.total || 0}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${data?.ocupacion?.porcentaje || 0}%` }} />
                  </div>
                  <p className="text-right text-xs text-slate-400 mt-1">{data?.ocupacion?.porcentaje || 0}% ocupado</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="text-xs text-slate-500">Estancia promedio</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data?.estanciaPromedio || 0} <span className="text-sm font-normal text-slate-400">días</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Cancelaciones</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data?.tasaCancelacion || 0}%</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'productos' && (
        <Card>
          <CardHeader><CardTitle>Productos Más Vendidos del Mes</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">#</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Producto</th>
                  <th className="text-right py-3 px-4 text-slate-500 font-medium">Unidad</th>
                  <th className="text-right py-3 px-4 text-slate-500 font-medium">Precio Venta</th>
                  <th className="text-right py-3 px-4 text-slate-500 font-medium">Cant. Vendida</th>
                  <th className="text-right py-3 px-4 text-slate-500 font-medium">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {topProductos.map((p: any, i: number) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-100">{p.nombre}</td>
                    <td className="py-3 px-4 text-right text-slate-500">{p.unidad || '-'}</td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{formatCurrency(parseFloat(p.precio_venta) || 0)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-100">{p.total_vendido}</td>
                    <td className="py-3 px-4 text-right font-semibold text-brand-600">{formatCurrency(parseFloat(p.total_ingresos) || 0)}</td>
                  </tr>
                ))}
                {!topProductos.length && (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">Sin datos este mes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'huespedes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Origen de Huéspedes</CardTitle></CardHeader>
            <div className="space-y-3 p-4">
              {(guestDemo?.origen || []).slice(0, 8).map((item: any, i: number) => {
                const totalOrig = guestDemo?.origen?.reduce((s: number, o: any) => s + parseInt(o.total || 0), 0) || 1;
                const pct = (parseInt(item.total || 0) / totalOrig) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 dark:text-slate-300">{item.ciudad}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">{item.total} <span className="text-xs text-slate-400">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {(!guestDemo?.origen || !guestDemo.origen.length) && (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos suficientes</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Crecimiento de Huéspedes</CardTitle></CardHeader>
            <div className="h-64 p-4">
              {(guestDemo?.tendencia || []).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={guestDemo.tendencia}>
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <Tooltip />
                    <Bar dataKey="nuevos" fill="#2563eb" radius={[4, 4, 0, 0]} name="Nuevos huéspedes" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-400 text-center py-12">Cargando datos...</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
