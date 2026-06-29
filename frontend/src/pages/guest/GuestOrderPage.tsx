import { useState, useEffect } from 'react';
import { guestApi } from '../../services/api';
import { useGuestStore } from '../../store/guestStore';
import { UtensilsCrossed, Wine, ShoppingBag, Plus, Minus, ShoppingCart, Loader2, CheckCircle, Clock } from 'lucide-react';
import { cn, formatCurrency } from '../../utils/helpers';

const tabs = [
  { id: 'Restaurante', label: 'Restaurante', icon: UtensilsCrossed },
  { id: 'Bar', label: 'Bar & Lounge', icon: Wine },
  { id: 'MiniMarket', label: 'Mini Market', icon: ShoppingBag },
];

interface CartItem {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export default function GuestOrderPage() {
  const { reservacion } = useGuestStore();
  const [modulo, setModulo] = useState('Restaurante');
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadProductos();
    loadPedidos();
  }, [modulo]);

  const loadProductos = async () => {
    setLoading(true);
    try {
      const { data } = await guestApi.productos(modulo);
      setProductos(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPedidos = async () => {
    try {
      const { data } = await guestApi.pedidos();
      setPedidos(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (producto: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.producto_id === producto.id);
      if (existing) {
        return prev.map((item) =>
          item.producto_id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { producto_id: producto.id, nombre: producto.nombre, cantidad: 1, precio_unitario: parseFloat(producto.precio_venta) }];
    });
  };

  const removeFromCart = (productoId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.producto_id === productoId);
      if (existing && existing.cantidad > 1) {
        return prev.map((item) =>
          item.producto_id === productoId
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        );
      }
      return prev.filter((item) => item.producto_id !== productoId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

  const submitOrder = async () => {
    if (!cart.length || !reservacion) return;
    setSubmitting(true);
    try {
      await guestApi.crearPedido({
        modulo,
        tipo_entrega: 'Habitación',
        productos: cart.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
        })),
      });
      setCart([]);
      setCartOpen(false);
      setSuccess(`Pedido enviado a ${modulo}`);
      setTimeout(() => setSuccess(''), 4000);
      loadPedidos();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Error al crear pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hacer Pedido</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHistory(!showHistory)} className="btn-ghost p-2 text-slate-500">
            <Clock size={18} />
          </button>
          <button onClick={() => setCartOpen(!cartOpen)} className="relative btn-ghost p-2 text-slate-500">
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {showHistory ? (
        <div>
          <button onClick={() => setShowHistory(false)} className="text-sm text-brand-600 mb-3">&larr; Volver al menú</button>
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Mis Pedidos</h2>
          {pedidos.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No has realizado pedidos aún</p>
          ) : (
            <div className="space-y-3">
              {pedidos.map((pedido) => (
                <div key={pedido.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500">{pedido.modulo}</span>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      pedido.estado === 'Completado' || pedido.estado === 'Entregado'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    )}>{pedido.estado}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">S/. {parseFloat(pedido.total).toFixed(2)}</p>
                  {pedido.detalles?.map((d: any) => (
                    <p key={d.id} className="text-xs text-slate-400">{d.cantidad}x {d.producto_nombre}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setModulo(tab.id); setCart([]); }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  modulo === tab.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-200 dark:shadow-brand-900/30'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-brand-600" />
            </div>
          ) : (
            <div className="grid gap-3">
              {productos.map((producto) => (
                <div key={producto.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{producto.nombre}</p>
                    {producto.descripcion && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{producto.descripcion}</p>
                    )}
                    <p className="text-sm font-bold text-brand-600 dark:text-brand-400 mt-1">
                      {formatCurrency(parseFloat(producto.precio_venta))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cart.find((c) => c.producto_id === producto.id) ? (
                      <div className="flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg px-2 py-1">
                        <button onClick={() => removeFromCart(producto.id)} className="p-0.5 text-brand-600 hover:text-brand-800">
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold text-brand-700 dark:text-brand-300 min-w-[18px] text-center">
                          {cart.find((c) => c.producto_id === producto.id)?.cantidad || 0}
                        </span>
                        <button
                          onClick={() => addToCart(producto)}
                          className="p-0.5 text-brand-600 hover:text-brand-800"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(producto)}
                        className="btn-primary text-sm px-3 py-1.5"
                      >
                        Agregar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {productos.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No hay productos disponibles en {modulo}</p>
              )}
            </div>
          )}
        </>
      )}

      {cartOpen && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setCartOpen(false)}>
          <div className="w-full bg-white dark:bg-slate-800 rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 dark:text-slate-100">Tu Pedido</h2>
              <button onClick={() => setCartOpen(false)} className="text-sm text-slate-400">Cerrar</button>
            </div>
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item.producto_id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{item.nombre}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(item.precio_unitario)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => removeFromCart(item.producto_id)} className="p-1 text-slate-400 hover:text-red-500">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold min-w-[18px] text-center">{item.cantidad}</span>
                    <button onClick={() => addToCart({ id: item.producto_id, precio_venta: item.precio_unitario, nombre: item.nombre })} className="p-1 text-slate-400 hover:text-green-500">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mb-4">
              <div className="flex items-center justify-between text-lg font-bold text-slate-800 dark:text-slate-100">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <p className="text-xs text-slate-400 text-right">Incluye IGV</p>
            </div>
            <button
              onClick={submitOrder}
              disabled={submitting}
              className="btn-primary w-full py-3"
            >
              {submitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Confirmar Pedido'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
