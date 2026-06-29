import { useState, useEffect } from 'react';
import { inventarioApi, pedidosApi } from '../../services/api';
import { Producto, Pedido } from '../../types';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { Plus, Minus, ShoppingCart, ChefHat, Search, ClipboardList, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RestaurantePage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidosActivos, setPedidosActivos] = useState<Pedido[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ producto: Producto; cantidad: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showPedidos, setShowPedidos] = useState(false);
  const [search, setSearch] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState('Local');
  const [mesa, setMesa] = useState('');

  useEffect(() => {
    loadData();
  }, [categoriaId]);

  const loadData = async () => {
    try {
      const [prodRes, pedRes, catRes] = await Promise.all([
        inventarioApi.listarProductos({ modulo: 'Restaurante', categoria_id: categoriaId || undefined }),
        pedidosApi.activos('Restaurante'),
        inventarioApi.categorias(),
      ]);
      setProductos(prodRes.data.data);
      setPedidosActivos(pedRes.data.data);
      setCategorias(catRes.data.data.filter((c: any) => c.modulo === 'Restaurante' || c.modulo === 'Todos'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
        modulo: 'Restaurante',
        tipo_entrega: tipoEntrega,
        mesa: mesa || undefined,
        productos: cart.map((c) => ({ producto_id: c.producto.id, cantidad: c.cantidad, precio_unitario: c.producto.precio_venta })),
      });
      toast.success('Pedido creado exitosamente');
      setCart([]);
      setShowCart(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al crear pedido');
    }
  };

  const handleEstadoPedido = async (id: number, estado: string) => {
    try {
      await pedidosApi.actualizarEstado(id, estado);
      toast.success(`Pedido actualizado: ${estado}`);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const filtered = productos.filter((p) => !search || p.nombre.toLowerCase().includes(search.toLowerCase()));
  const totalCart = cart.reduce((sum, c) => sum + c.cantidad * c.producto.precio_venta, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Restaurante</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestión de pedidos y menú digital</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPedidos(!showPedidos)} className="btn-secondary relative">
            <ClipboardList size={18} />
            <span className="hidden sm:inline">Pedidos</span>
            {pedidosActivos.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {pedidosActivos.length}
              </span>
            )}
          </button>
          <button onClick={() => setShowCart(true)} className="btn-primary relative">
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Nuevo Pedido</span>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-brand-700 text-xs rounded-full flex items-center justify-center font-bold">
                {cart.reduce((s, c) => s + c.cantidad, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Buscar platos..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategoriaId(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !categoriaId ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
          }`}>
          Todas
        </button>
        {categorias.map((cat) => (
          <button key={cat.id} onClick={() => setCategoriaId(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              categoriaId === cat.id ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
            }`}>
            {cat.nombre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((producto) => (
            <Card key={producto.id} hover onClick={() => addToCart(producto)} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed size={22} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{producto.nombre}</h3>
                  {producto.descripcion && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{producto.descripcion}</p>
                  )}
                  <p className="text-lg font-bold text-brand-600 dark:text-brand-400 mt-1">
                    {formatCurrency(producto.precio_venta)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCart} onClose={() => setShowCart(false)} title="Nuevo Pedido - Restaurante" size="lg">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="label">Tipo de Entrega</label>
              <select className="input" value={tipoEntrega} onChange={(e) => setTipoEntrega(e.target.value)}>
                <option value="Local">En Local</option>
                <option value="Habitación">A la Habitación</option>
                <option value="Cabaña">A la Cabaña</option>
                <option value="ParaLlevar">Para Llevar</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="label">Mesa #</label>
              <input className="input" value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Ej: 5" />
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {cart.map((c) => (
              <div key={c.producto.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{c.producto.nombre}</p>
                  <p className="text-xs text-slate-400">{formatCurrency(c.producto.precio_venta)} c/u</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => removeFromCart(c.producto.id)} className="p-1.5 bg-white dark:bg-slate-600 rounded-lg text-slate-600 hover:text-red-600 shadow-sm"><Minus size={16} /></button>
                  <span className="text-sm font-bold w-6 text-center text-slate-800 dark:text-slate-100">{c.cantidad}</span>
                  <button onClick={() => addToCart(c.producto)} className="p-1.5 bg-brand-600 text-white rounded-lg shadow-sm hover:bg-brand-700"><Plus size={16} /></button>
                  <span className="text-sm font-bold w-20 text-right text-slate-800 dark:text-slate-100">{formatCurrency(c.cantidad * c.producto.precio_venta)}</span>
                </div>
              </div>
            ))}
            {!cart.length && <p className="text-sm text-slate-400 text-center py-4">Seleccione productos del menú</p>}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalCart)}</p>
            </div>
            <button onClick={handleSubmitOrder} disabled={!cart.length} className="btn-primary py-3 px-6 shadow-md">
              <ChefHat size={18} /> Confirmar Pedido
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showPedidos} onClose={() => setShowPedidos(false)} title="Pedidos Activos - Restaurante" size="lg">
        <div className="space-y-3">
          {pedidosActivos.map((pedido) => (
            <div key={pedido.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-brand-600">#{pedido.id}</span>
                  <Badge variant={
                    pedido.estado === 'Pendiente' ? 'warning' :
                    pedido.estado === 'Preparando' ? 'info' :
                    pedido.estado === 'Completado' ? 'success' : 'neutral'
                  }>{pedido.estado}</Badge>
                </div>
                <span className="text-xs text-slate-400">{pedido.created_at ? formatDateTime(pedido.created_at) : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{pedido.huesped_nombre || 'Anónimo'}</p>
                  <p className="text-xs text-slate-400">{pedido.mesa ? `Mesa ${pedido.mesa}` : pedido.tipo_entrega}</p>
                </div>
                <div className="flex gap-2">
                  {pedido.estado === 'Pendiente' && (
                    <button onClick={() => handleEstadoPedido(pedido.id, 'Preparando')} className="btn-primary text-xs py-1.5 px-3">Preparando</button>
                  )}
                  {pedido.estado === 'Preparando' && (
                    <button onClick={() => handleEstadoPedido(pedido.id, 'Completado')} className="btn-success text-xs py-1.5 px-3">Completado</button>
                  )}
                  {pedido.estado === 'Completado' && (
                    <button onClick={() => handleEstadoPedido(pedido.id, 'Entregado')} className="btn-primary text-xs py-1.5 px-3">Entregado</button>
                  )}
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 ml-2">{formatCurrency(pedido.total)}</span>
                </div>
              </div>
            </div>
          ))}
          {!pedidosActivos.length && (
            <p className="text-sm text-slate-400 text-center py-4">No hay pedidos activos</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
