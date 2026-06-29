import { useState, useEffect } from 'react';
import { inventarioApi } from '../../services/api';
import { Producto } from '../../types';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { Plus, Search, TrendingUp, AlertTriangle, Package } from 'lucide-react';
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
          {stockBajo.length > 0 && (
            <button className="btn-danger relative">
              <AlertTriangle size={18} /> Stock Bajo
              <span className="ml-1 bg-white text-red-600 px-1.5 py-0.5 rounded-full text-xs font-bold">{stockBajo.length}</span>
            </button>
          )}
          <button className="btn-primary"><Plus size={18} /> Nuevo Producto</button>
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

      {tab === 'productos' ? (
        <Table columns={columns} data={filtered} isLoading={loading} onRowClick={(p) => setSelectedProducto(p)} emptyMessage="No hay productos registrados" />
      ) : (
        <Card>
          <div className="space-y-2">
            {loading ? [1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />) :
              movimientos.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">Sin movimientos registrados</p> :
              movimientos.slice(0, 50).map((m: any) => (
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
