import { useState, useEffect, useRef } from 'react';
import { dashboardApi, pedidosApi } from '../../services/api';
import { Bell, ShoppingCart, AlertTriangle, ClipboardList, X, CheckCircle, Loader2 } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

interface NotifItem {
  id: string;
  type: 'pedido' | 'stock' | 'alerta';
  title: string;
  message: string;
  time: string;
  link?: string;
  read: boolean;
  raw: any;
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const prevCount = useRef(0);

  useEffect(() => {
    if (!open) return;
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Background poll to update the badge count even when closed
  useEffect(() => {
    pollBadge();
    const interval = setInterval(pollBadge, 60000);
    return () => clearInterval(interval);
  }, []);

  const pollBadge = async () => {
    try {
      const [res, pedRes] = await Promise.all([
        dashboardApi.resumen().catch(() => null),
        pedidosApi.activos().catch(() => null),
      ]);
      const pending = pedRes?.data?.data?.length || 0;
      const stock = res?.data?.data?.stockBajo || 0;
      const total = pending + stock;
      if (total !== prevCount.current) {
        prevCount.current = total;
        if (open) load();
      } else {
        prevCount.current = total;
      }
    } catch {}
  };

  const load = async () => {
    setLoading(true);
    try {
      const [res, pedRes, alertRes] = await Promise.all([
        dashboardApi.resumen().catch(() => null),
        pedidosApi.activos().catch(() => null),
        dashboardApi.alertas().catch(() => null),
      ]);

      const list: NotifItem[] = [];

      const pedidos: any[] = pedRes?.data?.data || [];
      pedidos.forEach((p: any) => {
        list.push({
          id: `pedido-${p.id}`,
          type: 'pedido',
          title: `Pedido #${p.id} - ${p.modulo || ''}`,
          message: `${p.huesped_nombre || 'Anónimo'} · ${p.tipo_entrega || 'Local'} · S/${parseFloat(p.total || 0).toFixed(2)}`,
          time: p.created_at,
          link: `/${p.modulo?.toLowerCase() || 'restaurante'}`,
          read: false,
          raw: p,
        });
      });

      const stockBajo = res?.data?.data?.stockBajo || 0;
      if (stockBajo > 0) {
        list.push({
          id: 'stock-bajo',
          type: 'stock',
          title: 'Stock crítico',
          message: `${stockBajo} producto(s) por debajo del mínimo`,
          time: new Date().toISOString(),
          link: '/inventario',
          read: false,
          raw: { count: stockBajo },
        });
      }

      const alertas: any[] = alertRes?.data?.data || [];
      alertas.forEach((a: any) => {
        if (!a.leida) {
          list.push({
            id: `alerta-${a.id}`,
            type: 'alerta',
            title: a.titulo || a.tipo || 'Alerta',
            message: a.mensaje || '',
            time: a.created_at,
            link: a.tipo === 'Stock' ? '/inventario' : undefined,
            read: false,
            raw: a,
          });
        }
      });

      list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setItems(list);
    } catch {} finally { setLoading(false); }
  };

  const unread = items.filter((i) => !i.read).length;
  const badgeCount = prevCount.current;

  const markRead = (id: string) => {
    setItems((prev) => prev?.map((i) => (i.id === id ? { ...i, read: true } : i)));
  };

  const handleClick = (item: NotifItem) => {
    markRead(item.id);
    if (item.link) navigate(item.link);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="btn-ghost p-2 relative">
        <Bell size={18} />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Notificaciones</h3>
            {unread > 0 && (
              <button onClick={() => setItems((prev) => prev?.map((i) => ({ ...i, read: true })))}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium">Marcar todas leídas</button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-slate-400" /></div>
            ) : items?.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">Sin notificaciones</div>
            ) : (
              items.slice(0, 20)?.map((item) => (
                <button key={item.id} onClick={() => handleClick(item)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700/50 ${!item.read ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}>
                  <div className={`p-1.5 rounded-lg mt-0.5 flex-shrink-0 ${
                    item.type === 'pedido' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    item.type === 'stock' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {item.type === 'pedido' ? <ShoppingCart size={14} /> :
                     item.type === 'stock' ? <AlertTriangle size={14} /> : <ClipboardList size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!item.read ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(item.time)}</p>
                  </div>
                  {!item.read && <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
