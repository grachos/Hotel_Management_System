import { useState, useEffect } from 'react';
import { inventarioApi, pedidosApi, configApi } from '../../services/api';
import { Producto } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/helpers';
import { Plus, Minus, ShoppingCart, Search, Package, Building, Home, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MiniMarketPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ producto: Producto; cantidad: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState('Local');
  const [ocupados, setOcupados] = useState<any[]>([]);
  const [alojamientoId, setAlojamientoId] = useState<number | ''>('');
  const [recargoDelivery, setRecargoDelivery] = useState(0);
  const [loadingOcupados, setLoadingOcupados] = useState(false);

  useEffect(() => { loadData(); }, [categoriaId]);

  useEffect(() => {
    if (tipoEntrega === 'Habitación' || tipoEntrega === 'Cabaña') {
      loadOcupados();
    } else {
      setOcupados([]);
      setAlojamientoId('');
    }
  }, [tipoEntrega]);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        inventarioApi.listarProductos({ modulo: 'MiniMarket', categoria_id: categoriaId || undefined }),
        inventarioApi.categorias(),
      ]);
      setProductos(prodRes.data.data);
      setCategorias(catRes.data.data.filter((c: any) => c.modulo === 'MiniMarket' || c.modulo === 'Todos'));
      const { data: cfg } = await configApi.getAll();
      const recargo = cfg.data.find((c: any) => c.clave === 'delivery.recargo');
      if (recargo) setRecargoDelivery(parseFloat(recargo.valor || '0'));
    } finally { setLoading(false); }
  };

  const loadOcupados = async () => {
    setLoadingOcupados(true);
    try {
      const { data } = await pedidosApi.ocupados();
      setOcupados(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingOcupados(false); }
  };

  const addToCart = (producto: Producto) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.producto.id === producto.id);
      if (existing) return prev?.map((c) => c.producto.id === producto.id ? { ...c, cantidad: c.cantidad + 1 } : c);
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const removeFromCart = (productoId: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.producto.id === productoId);
      if (existing && existing.cantidad > 1) return prev?.map((c) => c.producto.id === productoId ? { ...c, cantidad: c.cantidad - 1 } : c);
      return prev.filter((c) => c.producto.id !== productoId);
    });
  };

  const handleSubmitOrder = async () => {
    if (!cart.length) return;
    try {
      const payload: any = {
        modulo: 'MiniMarket',
        tipo_entrega: tipoEntrega,
        recargo_delivery: (tipoEntrega === 'Habitación' || tipoEntrega === 'Cabaña') ? recargoDelivery : 0,
        productos: cart?.map((c) => ({ producto_id: c.producto.id, cantidad: c.cantidad, precio_unitario: c.producto.precio_venta })),
      };
      if ((tipoEntrega === 'Habitación' || tipoEntrega === 'Cabaña') && alojamientoId) {
        payload.alojamiento_id = alojamientoId;
      }
      await pedidosApi.crear(payload);
      toast.success('Venta registrada');
      setCart([]); setShowCart(false);
      setAlojamientoId('');
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const filtered = productos.filter((p) => !search || p.nombre.toLowerCase().includes(search.toLowerCase()));
  const totalCart = cart.reduce((sum, c) => sum + c.cantidad * c.producto.precio_venta, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mini Market</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Snacks, bebidas, souvenirs y más</p>
        </div>
        <button onClick={() => setShowCart(true)} className="btn-primary relative">
          <ShoppingCart size={18} /> Vender
          {cart?.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-brand-700 text-xs rounded-full flex items-center justify-center font-bold">{cart.reduce((s, c) => s + c.cantidad, 0)}</span>
          )}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Buscar productos..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategoriaId(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!categoriaId ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 border border-slate-200'}`}>Todos</button>
        {categorias?.map((cat) => (
          <button key={cat.id} onClick={() => setCategoriaId(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${categoriaId === cat.id ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 border border-slate-200'}`}>{cat.nombre}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8]?.map((i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered?.map((p) => (
            <Card key={p.id} hover onClick={() => addToCart(p)} className="p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
                  <Package size={24} className="text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">{p.nombre}</h3>
                <p className="text-base font-bold text-brand-600">{formatCurrency(p.precio_venta)}</p>
                {p.stock_actual <= p.stock_minimo && <Badge variant="danger">Stock: {p.stock_actual}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCart} onClose={() => setShowCart(false)} title="Registrar Venta - Mini Market" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Tipo de Entrega</label>
            <select className="input" value={tipoEntrega} onChange={(e) => setTipoEntrega(e.target.value)}>
              <option value="Local">En Tienda</option>
              <option value="Habitación">A la Habitación</option>
              <option value="Cabaña">A la Cabaña</option>
            </select>
          </div>

          {(tipoEntrega === 'Habitación' || tipoEntrega === 'Cabaña') && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl border border-cyan-200 dark:border-cyan-800">
              <div>
                <label className="label">
                  {tipoEntrega === 'Habitación' ? <><Building size={14} className="inline mr-1" /> Habitación</> : <><Home size={14} className="inline mr-1" /> Cabaña</>}
                </label>
                {loadingOcupados ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Cargando...</div>
                ) : (
                  <select className="input" value={alojamientoId}
                    onChange={(e) => setAlojamientoId(Number(e.target.value) || '')}>
                    <option value="">Seleccionar {tipoEntrega === 'Habitación' ? 'habitación' : 'cabaña'} ocupada</option>
                    {ocupados
                      .filter((o) => o.tipo_alojamiento === (tipoEntrega === 'Habitación' ? 'Habitación' : 'Cabaña'))
                      .map((o) => (
                        <option key={o.alojamiento_id} value={o.alojamiento_id}>
                          {o.numero || o.nombre} - {o.huesped_nombre}
                        </option>
                      ))}
                  </select>
                )}
              </div>
              <div>
                <label className="label">Recargo Delivery (S/.)</label>
                <input className="input" type="number" step="0.5" min="0" value={recargoDelivery} readOnly tabIndex={-1} />
                <p className="text-xs text-slate-400 mt-1">Configurado en Administración</p>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {cart?.map((c) => (
              <div key={c.producto.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
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
            <div>
              <p className="text-sm text-slate-500">
                Total{recargoDelivery > 0 ? ` (inc. S/.${recargoDelivery.toFixed(2)} delivery)` : ''}
              </p>
              <p className="text-2xl font-bold">{formatCurrency(totalCart + recargoDelivery)}</p>
            </div>
            <button onClick={handleSubmitOrder} disabled={!cart.length || ((tipoEntrega === 'Habitación' || tipoEntrega === 'Cabaña') && !alojamientoId)} className="btn-primary py-3 px-6">
              Cobrar S/. {formatCurrency(totalCart + recargoDelivery).replace('S/. ', '')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
