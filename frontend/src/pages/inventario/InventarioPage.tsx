import { useState, useEffect } from 'react';
import { inventarioApi } from '../../services/api';
import { Producto } from '../../types';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { Plus, Search, TrendingUp, AlertTriangle, Package, X, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'productos' | 'movimientos'>('productos');
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [showAjuste, setShowAjuste] = useState(false);
  const [ajusteCantidad, setAjusteCantidad] = useState(0);
  const [ajusteTipo, setAjusteTipo] = useState('Entrada');
  const [ajusteObs, setAjusteObs] = useState('');

  const [showNuevo, setShowNuevo] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [nuevoForm, setNuevoForm] = useState({
    categoria_id: '', proveedor_id: '', nombre: '', descripcion: '',
    sku: '', unidad: 'Unidad', stock_actual: 0, stock_minimo: 5,
    precio_compra: 0, precio_venta: 0,
  });

  const unidades = ['Unidad', 'Kg', 'Lt', 'Gr', 'Ml', 'Docena', 'Caja', 'Pack', 'Botella', 'Porción'];

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    try {
      if (tab === 'productos') {
        const { data } = await inventarioApi.listarProductos({ search: search || undefined });
        setProductos(data.data);
      } else {
        const { data } = await inventarioApi.listarMovimientos();
        setMovimientos(data.data);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const openNuevo = async () => {
    try {
      const [catRes, provRes] = await Promise.all([
        inventarioApi.categorias(),
        inventarioApi.proveedores(),
      ]);
      setCategorias(catRes.data.data || []);
      setProveedores(provRes.data.data || []);
    } catch (err) { console.error(err); }
    setNuevoForm({ categoria_id: '', proveedor_id: '', nombre: '', descripcion: '', sku: '', unidad: 'Unidad', stock_actual: 0, stock_minimo: 5, precio_compra: 0, precio_venta: 0 });
    setShowNuevo(true);
  };

  const handleCrearProducto = async () => {
    if (!nuevoForm.nombre || !nuevoForm.categoria_id) { toast.error('Nombre y categoría son obligatorios'); return; }
    setSaving(true);
    try {
      await inventarioApi.crearProducto({
        ...nuevoForm,
        categoria_id: Number(nuevoForm.categoria_id),
        proveedor_id: nuevoForm.proveedor_id ? Number(nuevoForm.proveedor_id) : undefined,
      });
      setSuccess('Producto creado');
      setTimeout(() => setSuccess(''), 3000);
      setShowNuevo(false);
      loadData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error al crear'); }
    finally { setSaving(false); }
  };

  const handleAjusteStock = async () => {
    if (!selectedProducto || !ajusteCantidad) return;
    try {
      await inventarioApi.ajustarStock(selectedProducto.id, { cantidad: ajusteCantidad, tipo: ajusteTipo, observacion: ajusteObs });
      toast.success('Stock ajustado');
      setShowAjuste(false); setSelectedProducto(null); loadData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const filtered = search ? productos.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())) : productos;
  const stockBajo = productos.filter((p) => p.stock_actual <= p.stock_minimo);

  const columns = [
    { key: 'nombre', header: 'Producto', render: (p: Producto) => (
      <div className="flex items-center gap-2">
        <Package size={16} className="text-slate-400" />
        <div><p className="font-medium text-slate-800 dark:text-slate-100">{p.nombre}</p><p className="text-xs text-slate-400">{p.sku}</p></div>
      </div>
    )},
    { key: 'categoria_nombre', header: 'Categoría' },
    { key: 'stock_actual', header: 'Stock Actual', render: (p: Producto) => (
      <span className={p.stock_actual <= p.stock_minimo ? 'text-red-600 font-bold' : 'font-medium'}>{p.stock_actual} {p.unidad}</span>
    )},
    { key: 'stock_minimo', header: 'Stock Mínimo', render: (p: Producto) => `${p.stock_minimo} ${p.unidad}` },
    { key: 'precio_compra', header: 'Costo', render: (p: Producto) => formatCurrency(p.precio_compra) },
    { key: 'precio_venta', header: 'Venta', render: (p: Producto) => <span className="font-bold text-brand-600">{formatCurrency(p.precio_venta)}</span> },
    { key: 'estado', header: 'Estado', render: (p: Producto) => p.stock_actual <= p.stock_minimo ? <Badge variant="danger">Stock Bajo</Badge> : <Badge variant="success">OK</Badge> },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Inventario Centralizado</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tiempo real en todos los módulos</p>
        </div>
        <div className="flex gap-3">
          {stockBajo?.length > 0 && (
            <button className="btn-danger relative">
              <AlertTriangle size={18} /> Stock Bajo
              <span className="ml-1 bg-white text-red-600 px-1.5 py-0.5 rounded-full text-xs font-bold">{stockBajo.length}</span>
            </button>
          )}
          <button onClick={openNuevo} className="btn-primary"><Plus size={18} /> Nuevo Producto</button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('productos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'productos' ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 border border-slate-200'}`}>Productos</button>
        <button onClick={() => setTab('movimientos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'movimientos' ? 'bg-brand-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 border border-slate-200'}`}>Movimientos</button>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Buscar productos..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {tab === 'productos' ? (
        <Table columns={columns} data={filtered} isLoading={loading} onRowClick={(p) => setSelectedProducto(p)} emptyMessage="No hay productos registrados" />
      ) : (
        <Card>
          <div className="space-y-2">
            {loading ? [1, 2, 3]?.map((i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />) :
              movimientos?.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">Sin movimientos registrados</p> :
              movimientos.slice(0, 50)?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      m.tipo === 'Entrada' || m.tipo === 'Compra' ? 'bg-emerald-50 text-emerald-600' :
                      m.tipo === 'Salida' || m.tipo === 'Venta' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}><TrendingUp size={16} /></div>
                    <div><p className="text-sm font-medium">{m.producto_nombre}</p><p className="text-xs text-slate-400">{m.tipo} - {m.cantidad} unidades ({m.stock_anterior} → {m.stock_nuevo})</p></div>
                  </div>
                  <div className="text-right"><p className="text-xs text-slate-400">{m.usuario_nombre}</p><p className="text-xs text-slate-400">{formatDateTime(m.created_at)}</p></div>
                </div>
              ))
            }
          </div>
        </Card>
      )}

      <Modal isOpen={showNuevo} onClose={() => setShowNuevo(false)} title="Nuevo Producto" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre *</label>
              <input className="input" value={nuevoForm.nombre} onChange={(e) => setNuevoForm({...nuevoForm, nombre: e.target.value})} placeholder="Nombre del producto" />
            </div>
            <div>
              <label className="label">Categoría *</label>
              <select className="input" value={nuevoForm.categoria_id} onChange={(e) => setNuevoForm({...nuevoForm, categoria_id: e.target.value})}>
                <option value="">Seleccionar</option>
                {categorias?.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.modulo})</option>)}
              </select>
            </div>

            <div>
              <label className="label">SKU</label>
              <input className="input" value={nuevoForm.sku} onChange={(e) => setNuevoForm({...nuevoForm, sku: e.target.value})} placeholder="Código único" />
            </div>
            <div>
              <label className="label">Unidad</label>
              <select className="input" value={nuevoForm.unidad} onChange={(e) => setNuevoForm({...nuevoForm, unidad: e.target.value})}>
                {unidades?.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Stock Actual</label>
              <input className="input" type="number" min="0" step="0.5" value={nuevoForm.stock_actual} onChange={(e) => setNuevoForm({...nuevoForm, stock_actual: Number(e.target.value)})} />
            </div>
            <div>
              <label className="label">Stock Mínimo</label>
              <input className="input" type="number" min="0" step="0.5" value={nuevoForm.stock_minimo} onChange={(e) => setNuevoForm({...nuevoForm, stock_minimo: Number(e.target.value)})} />
            </div>
            <div>
              <label className="label">Precio Compra (S/.)</label>
              <input className="input" type="number" min="0" step="0.01" value={nuevoForm.precio_compra} onChange={(e) => setNuevoForm({...nuevoForm, precio_compra: Number(e.target.value)})} />
            </div>
            <div>
              <label className="label">Precio Venta (S/.)</label>
              <input className="input" type="number" min="0" step="0.01" value={nuevoForm.precio_venta} onChange={(e) => setNuevoForm({...nuevoForm, precio_venta: Number(e.target.value)})} />
            </div>
            <div className="col-span-2">
              <label className="label">Descripción</label>
              <textarea className="input" rows={2} value={nuevoForm.descripcion} onChange={(e) => setNuevoForm({...nuevoForm, descripcion: e.target.value})} placeholder="Descripción del producto" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button onClick={() => setShowNuevo(false)} className="btn-secondary flex-1" disabled={saving}>Cancelar</button>
            <button onClick={handleCrearProducto} className="btn-primary flex-1" disabled={saving}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              {saving ? 'Creando...' : 'Crear Producto'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selectedProducto && !showAjuste} onClose={() => setSelectedProducto(null)} title="Detalle del Producto" size="lg">
        {selectedProducto && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Nombre</label><p className="text-slate-700 dark:text-slate-300">{selectedProducto.nombre}</p></div>
              <div><label className="label">SKU</label><p className="text-slate-700 dark:text-slate-300 font-mono">{selectedProducto.sku || '-'}</p></div>
              <div><label className="label">Categoría</label><p className="text-slate-700 dark:text-slate-300">{selectedProducto.categoria_nombre}</p></div>
              <div><label className="label">Proveedor</label><p className="text-slate-700 dark:text-slate-300">{selectedProducto.proveedor_nombre || '-'}</p></div>
              <div><label className="label">Stock Actual</label><p className={`text-lg font-bold ${selectedProducto.stock_actual <= selectedProducto.stock_minimo ? 'text-red-500' : 'text-emerald-500'}`}>{selectedProducto.stock_actual} {selectedProducto.unidad}</p></div>
              <div><label className="label">Stock Mínimo</label><p className="text-slate-700">{selectedProducto.stock_minimo} {selectedProducto.unidad}</p></div>
              <div><label className="label">Precio de Compra</label><p className="text-slate-700">{formatCurrency(selectedProducto.precio_compra)}</p></div>
              <div><label className="label">Precio de Venta</label><p className="text-lg font-bold text-brand-600">{formatCurrency(selectedProducto.precio_venta)}</p></div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => { setShowAjuste(true); }} className="btn-primary flex-1"><TrendingUp size={18} /> Ajustar Stock</button>
              <button className="btn-secondary flex-1">Editar</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showAjuste} onClose={() => setShowAjuste(false)} title="Ajustar Stock" size="sm">
        <div className="space-y-4">
          <div><label className="label">Tipo</label>
            <select className="input" value={ajusteTipo} onChange={(e) => setAjusteTipo(e.target.value)}>
              <option value="Entrada">Entrada</option><option value="Salida">Salida</option><option value="Ajuste">Ajuste</option>
            </select>
          </div>
          <div><label className="label">Cantidad</label><input type="number" className="input" value={ajusteCantidad} onChange={(e) => setAjusteCantidad(Number(e.target.value))} min="0" step="0.5" /></div>
          <div><label className="label">Observación</label><input className="input" value={ajusteObs} onChange={(e) => setAjusteObs(e.target.value)} placeholder="Motivo del ajuste" /></div>
          <button onClick={handleAjusteStock} className="btn-primary w-full">Confirmar Ajuste</button>
        </div>
      </Modal>
    </div>
  );
}
