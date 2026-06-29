import { useState, useEffect } from 'react';
import { dashboardApi } from '../../services/api';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/helpers';
import { TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg p-3 text-sm">
        <p className="text-slate-500 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-bold text-slate-800 dark:text-slate-100" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'Total' ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportesPage() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(30);

  useEffect(() => { loadData(); }, [periodo]);

  const loadData = async () => {
    try {
      const { data } = await dashboardApi.ventas(periodo);
      setVentas(data.data);
    } finally { setLoading(false); }
  };

  const totalVentas = ventas.reduce((sum: number, v: any) => sum + parseFloat(v.total || 0), 0);
  const totalPedidos = ventas.reduce((sum: number, v: any) => sum + parseInt(v.pedidos || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reportes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Análisis de ventas y rendimiento</p>
        </div>
        <div className="flex gap-2">
          {[7, 15, 30, 90].map((d) => (
            <button key={d} onClick={() => setPeriodo(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${periodo === d ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 border border-slate-200 dark:border-slate-600 hover:bg-slate-50'}`}>{d} días</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600"><DollarSign size={24} /></div>
            <div><p className="text-sm font-medium text-slate-500">Ventas Totales</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalVentas)}</p></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"><ShoppingBag size={24} /></div>
            <div><p className="text-sm font-medium text-slate-500">Total Pedidos</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalPedidos}</p></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600"><TrendingUp size={24} /></div>
            <div><p className="text-sm font-medium text-slate-500">Promedio Diario</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalVentas / Math.max(periodo, 1))}</p></div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Evolución de Ventas</CardTitle></CardHeader>
        <div className="h-80">
          {loading ? (
            <div className="animate-pulse h-full bg-slate-100 dark:bg-slate-700 rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventas}>
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => new Date(v).toLocaleDateString('es', { day: '2-digit', month: '2-digit' })} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pedidos" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Resumen de Ventas por Día</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Fecha</th>
                <th className="text-right py-3 px-4 text-slate-500 font-medium">Pedidos</th>
                <th className="text-right py-3 px-4 text-slate-500 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {ventas.slice().reverse().map((v: any) => (
                <tr key={v.fecha} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {new Date(v.fecha).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{v.pedidos}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(parseFloat(v.total) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
