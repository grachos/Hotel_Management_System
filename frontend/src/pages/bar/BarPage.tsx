import { useState, useEffect } from 'react';
import { inventarioApi, pedidosApi } from '../../services/api';
import { Producto, Pedido } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, getEstadoColor, formatDateTime } from '../../utils/helpers';
import { Plus, Minus, ShoppingCart, Search, ClipboardList, Wine } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BarPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidosActivos, setPedidosActivos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ producto: Producto; cantidad: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showPedidos, setShowPedidos] = useState(false);
  const [search, setSearch] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState('Local');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prodRes, pedRes] = await Promise.all([
        inventarioApi.listarProductos({ modulo: 'Bar' }),
        pedidosApi.activos('Bar'),
      ]);
      setProductos(prodRes.data.data);
      setPedidosActivos(pedRes.data.data);
    } finally { setLoading(false); }
  };

  const addToCart = (producto: Producto) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.producto.id === producto.id);
      if (existing) return prev.map((c) => c.producto.id === producto.id ? { ...c, cantidad: c.cantidad + 1 } : c);
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const removeFromCart = (productoId: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.producto.id === productoId);
      if (existing && existing.cantidad > 1) return prev.map((c) => c.producto.id === productoId ? { ...c, cantidad: c.cantidad - 1 } : c);
      return prev.filter((c) => c.producto.id !== productoId);
    });
  };

  const handleSubmitOrder = async () => {
    if (!cart.length) return;
    try {
      await pedidosApi.crear({
        modulo: 'Bar', tipo_entrega: tipoEntrega,
        productos: cart.map((c) => ({ producto_id: c.producto.id, cantidad: c.cantidad, precio_unitario: c.producto.precio_venta })),
      });
      toast.success('Pedido creado');
      setCart([]); setShowCart(false); loadData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEstado = async (id: number, estado: string) => {
    try { await pedidosApi.actualizarEstado(id, estado); toast.success(`Pedido: ${estado}`); loadData(); }
    catch (err: any) { toast.error('Error'); }
  };

  const filtered = productos.filter((p) => !search || p.nombre.toLowerCase().includes(search.toLowerCase()));
  const totalCart = cart.reduce((sum, c) => sum + c.cantidad * c.producto.precio_venta, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bar & Lounge</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cocktails, cervezas y licores</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPedidos(!showPedidos)} className="btn-secondary relative">
            <ClipboardList size={18} />
            {pedidosActivos.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pedidosActivos.length}</span>
            )}
          </button>
          <button onClick={() => setShowCart(true)} className="btn-primary relative">
            <ShoppingCart size={18} /> Nuevo Pedido
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-brand-700 text-xs rounded-full flex items-center justify-center font-bold">{cart.reduce((s, c) => s + c.cantidad, 0)}</span>
            )}
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Buscar bebidas..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} hover onClick={() => addToCart(p)} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                  <Wine size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{p.nombre}</h3>
                  <p className="text-xs text-slate-400">{p.unidad}</p>
                </div>
                <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{formatCurrency(p.precio_venta)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCart} onClose={() => setShowCart(false)} title="Nuevo Pedido - Bar" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label">Tipo de Entrega</label>
            <select className="input" value={tipoEntrega} onChange={(e) => setTipoEntrega(e.target.value)}>
              <option value="Local">En Barra</option>
              <option value="Habitación">A la Habitación</option>
              <option value="Cabaña">A la Cabaña</option>
            </select>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {cart.map((c) => (
              <div key={c.producto.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                <div><p className="text-sm font-medium">{c.producto.nombre}</p><p className="text-xs text-slate-400">{formatCurrency(c.producto.precio_venta)}</p></div>
                <div className="flex items-center gap-3">
                  <button onClick={() => removeFromCart(c.producto.id)} className="p-1.5 bg-white dark:bg-slate-600 rounded-lg shadow-sm"><Minus size={16} /></button>
                  <span className="text-sm font-bold w-6 text-center">{c.cantidad}</span>
                  <button onClick={() => addToCart(c.producto)} className="p-1.5 bg-brand-600 text-white rounded-lg shadow-sm"><Plus size={16} /></button>
                  <span className="text-sm font-bold w-20 text-right">{formatCurrency(c.cantidad * c.producto.precio_venta)}</span>
                </div>
              </div>
            ))}
            {!cart.length && <p className="text-sm text-slate-400 text-center py-4">Seleccione productos</p>}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <p className="text-2xl font-bold">{formatCurrency(totalCart)}</p>
            <button onClick={handleSubmitOrder} disabled={!cart.length} className="btn-primary py-3 px-6">Confirmar Pedido</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showPedidos} onClose={() => setShowPedidos(false)} title="Pedidos Activos - Bar" size="lg">
        <div className="space-y-3">
          {pedidosActivos.map((pedido) => (
            <div key={pedido.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-bold text-brand-600">#{pedido.id}</span>
                <Badge variant={getEstadoColor(pedido.estado) as any}>{pedido.estado}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{pedido.huesped_nombre || 'Anónimo'} - {pedido.tipo_entrega}</span>
                <div className="flex gap-2">
                  {pedido.estado === 'Pendiente' && <button onClick={() => handleEstado(pedido.id, 'Preparando')} className="btn-primary text-xs py-1.5 px-3">Preparar</button>}
                  {pedido.estado === 'Preparando' && <button onClick={() => handleEstado(pedido.id, 'Completado')} className="btn-success text-xs py-1.5 px-3">Completado</button>}
                </div>
              </div>
            </div>
          ))}
          {!pedidosActivos.length && <p className="text-sm text-slate-400 text-center py-4">Sin pedidos activos</p>}
        </div>
      </Modal>
    </div>
  );
}
