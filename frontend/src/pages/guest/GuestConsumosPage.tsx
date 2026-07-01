import { useState, useEffect } from 'react';
import { guestApi } from '../../services/api';
import { Loader2, Receipt } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function GuestConsumosPage() {
  const [consumos, setConsumos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'consumos' | 'pedidos'>('consumos');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [consRes, pedRes] = await Promise.all([
        guestApi.consumos(),
        guestApi.pedidos(),
      ]);
      setConsumos(consRes.data.data);
      setTotal(parseFloat(consRes.data.total || 0));
      setPedidos(pedRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mi Cuenta</h1>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center">
            <Receipt size={20} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total acumulado</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('consumos')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === 'consumos'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Consumos
        </button>
        <button
          onClick={() => setTab('pedidos')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === 'pedidos'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Pedidos
        </button>
      </div>

      {tab === 'consumos' ? (
        consumos?.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No hay consumos registrados</p>
        ) : (
          <div className="space-y-2">
            {consumos?.map((consumo, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{consumo.producto_nombre}</p>
                  <p className="text-xs text-slate-400">
                    {consumo.cantidad}x {consumo.modulo} · {consumo.tipo_entrega}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(parseFloat(consumo.subtotal))}
                </p>
              </div>
            ))}
          </div>
        )
      ) : (
        pedidos?.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No hay pedidos registrados</p>
        ) : (
          <div className="space-y-3">
            {pedidos?.map((pedido) => (
              <div key={pedido.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
                      {pedido.modulo}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      pedido.estado === 'Entregado' || pedido.estado === 'Completado'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>{pedido.estado}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {formatCurrency(parseFloat(pedido.total))}
                  </p>
                </div>
                {pedido.detalles?.map((d: any) => (
                  <p key={d.id} className="text-xs text-slate-400 pl-1">{d.cantidad}x {d.producto_nombre}</p>
                ))}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
