import { useState } from 'react';
import { addProduct, addStock, getProducts, getStockMovements } from '../services/productService';
import type { Product } from '../types/pos';
type InventoryState = 'Disponible' | 'Stock bajo' | 'Crítico';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  Plus, 
  RefreshCw, 
  MoreHorizontal,
  Clock
} from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState<Product[]>(() => getProducts());
  const [showForm, setShowForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showKardex, setShowKardex] = useState(false);
  const [stockForm, setStockForm] = useState({ productId: '', cantidad: '', motivo: 'Ingreso de mercadería' });
  const [stockError, setStockError] = useState('');
  const [movements, setMovements] = useState(() => getStockMovements());
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({nombre:'', categoria:'Tecnología', precio:'', stock:'', imagen:''});
  const refreshItems = () => { setItems(getProducts()); setMovements(getStockMovements()); };
  const submitStock = (e: React.FormEvent) => { e.preventDefault(); try { if (!stockForm.productId) throw new Error('Selecciona un producto.'); addStock(Number(stockForm.productId), Number(stockForm.cantidad), stockForm.motivo); refreshItems(); setStockForm({ productId: '', cantidad: '', motivo: 'Ingreso de mercadería' }); setStockError(''); setShowStockForm(false); } catch (err) { setStockError(err instanceof Error ? err.message : 'No se pudo ingresar el stock.'); } };
  const submitProduct = (e: React.FormEvent) => { e.preventDefault(); const precio=Number(form.precio), stock=Number(form.stock); if (!form.nombre.trim() || !form.categoria.trim() || !Number.isFinite(precio) || precio <= 0 || !Number.isInteger(stock) || stock < 0) { setFormError('Completa nombre, categoría, precio válido y stock entero no negativo.'); return; } try { addProduct({nombre:form.nombre.trim(),categoria:form.categoria,precio,stock,imagen:form.imagen.trim() || ''}); refreshItems(); setForm({nombre:'',categoria:'Tecnología',precio:'',stock:'',imagen:''}); setFormError(''); setShowForm(false); } catch { setFormError('No se pudo guardar el producto.'); } };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedState, setSelectedState] = useState('Todos');

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.id).includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || item.categoria === selectedCategory;
    const estado = item.stock <= 5 ? 'Crítico' : item.stock <= 10 ? 'Stock bajo' : 'Disponible';
    const matchesState = selectedState === 'Todos' || estado === selectedState;
    return matchesSearch && matchesCategory && matchesState;
  });

  const getStatusBadge = (estado: InventoryState) => {
    switch (estado) {
      case 'Disponible':
        return <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">Disponible</span>;
      case 'Stock bajo':
        return <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">Stock bajo</span>;
      case 'Crítico':
        return <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">Crítico</span>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
            ALMACÉN E INVENTARIO
          </p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Control de inventario
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra tus productos, existencias y movimientos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => { setShowKardex(v => !v); setMovements(getStockMovements()); }} className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-medium text-xs px-4 py-2.5 rounded-xl shadow-xs hover:bg-slate-50 transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>{showKardex ? 'Ocultar Kardex' : 'Ver Kardex'}</span>
          </button>
          
          <button onClick={() => setShowStockForm(true)} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"><Plus className="w-4 h-4" /><span>Ingresar stock</span></button>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Añadir nuevo producto</span>
          </button>
        </div>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total de productos</p>
            <h3 className="text-2xl font-black text-slate-900">{items.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock bajo</p>
            <h3 className="text-2xl font-black text-slate-900">{items.filter(i => i.stock > 5 && i.stock <= 10).length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock crítico</p>
            <h3 className="text-2xl font-black text-slate-900">{items.filter(i => i.stock <= 5).length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valor de inventario</p>
            <h3 className="text-2xl font-black text-slate-900">S/ {items.reduce((a,i)=>a+i.stock*i.precio,0).toLocaleString('es-PE',{minimumFractionDigits:2})}</h3>
          </div>
        </div>
      </div>

      
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        
        
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Todas">Categoría: Todas</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Oficina">Oficina</option>
              <option value="Accesorios">Accesorios</option>{Array.from(new Set(items.map(i=>i.categoria))).filter(c=>!(['Tecnología','Oficina','Accesorios'].includes(c))).map(c=><option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Todos">Estado: Todos</option>
              <option value="Disponible">Disponible</option>
              <option value="Stock bajo">Stock bajo</option>
              <option value="Crítico">Crítico</option>
            </select>

            <button className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer">
              Más filtros
            </button>
          </div>
        </div>

        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6">Código</th>
                <th className="py-3.5 px-6">Producto</th>
                <th className="py-3.5 px-6">Categoría</th>
                <th className="py-3.5 px-6">Existencias</th>
                <th className="py-3.5 px-6">Precio</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredItems.map((item) => (
                <tr key={'PRO-' + String(item.id).padStart(3,'0')} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <span className="bg-blue-50 text-blue-600 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                      {'PRO-' + String(item.id).padStart(3,'0')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                      />
                      <span className="font-bold text-slate-900">{item.nombre}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-500 font-medium">{item.categoria}</td>
                  <td className="py-4 px-6">
                    <span className={`font-bold ${item.stock <= 5 ? 'text-red-600' : 'text-slate-800'}`}>
                      {item.stock} und.
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">S/ {item.precio.toFixed(2)}</td>
                  <td className="py-4 px-6">{getStatusBadge(item.stock <= 5 ? 'Crítico' : item.stock <= 10 ? 'Stock bajo' : 'Disponible')}</td>
                  <td className="py-4 px-6 text-right">
                    <button type="button" title="Actualizar inventario" onClick={() => setItems(getProducts())} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
      {showKardex && <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden"><div className="p-5 border-b"><h2 className="text-lg font-bold">Kardex de movimientos</h2><p className="text-sm text-slate-500">Entradas, salidas por ventas y stock inicial.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Fecha</th><th className="p-3">Producto</th><th className="p-3">Movimiento</th><th className="p-3">Cantidad</th><th className="p-3">Stock anterior</th><th className="p-3">Stock resultante</th><th className="p-3">Motivo</th></tr></thead><tbody>{movements.map(m => <tr key={m.id} className="border-t"><td className="p-3">{new Date(m.fecha).toLocaleString('es-PE')}</td><td className="p-3">{m.producto}</td><td className="p-3">{m.tipo}</td><td className="p-3">{m.cantidad}</td><td className="p-3">{m.stockAnterior}</td><td className="p-3">{m.stockResultante}</td><td className="p-3">{m.motivo}</td></tr>)}</tbody></table>{movements.length === 0 && <p className="p-5 text-sm text-slate-500">Aún no hay movimientos registrados.</p>}</div></div>}
      {showStockForm && <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"><form onSubmit={submitStock} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg space-y-4"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Ingresar mercadería</h2><button type="button" onClick={() => setShowStockForm(false)} className="text-slate-500">✕</button></div>{stockError && <p role="alert" className="text-sm text-red-600">{stockError}</p>}<label className="block text-sm">Producto<select required value={stockForm.productId} onChange={e => setStockForm({...stockForm, productId:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2"><option value="">Selecciona un producto</option>{items.map(p => <option key={p.id} value={p.id}>{p.nombre} (stock actual: {p.stock})</option>)}</select></label><label className="block text-sm">Cantidad recibida<input required type="number" min="1" step="1" value={stockForm.cantidad} onChange={e => setStockForm({...stockForm,cantidad:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><label className="block text-sm">Motivo / referencia<input value={stockForm.motivo} onChange={e => setStockForm({...stockForm,motivo:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowStockForm(false)} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Registrar entrada</button></div></form></div>}
      {showForm && <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"><form onSubmit={submitProduct} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg space-y-4"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Registrar nuevo producto</h2><button type="button" onClick={()=>setShowForm(false)} className="text-slate-500">✕</button></div>{formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}<label className="block text-sm">Nombre<input required value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><label className="block text-sm">Categoría<input required value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm">Precio (S/)<input required type="number" min="0.01" step="0.01" value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><label className="block text-sm">Stock inicial<input required type="number" min="0" step="1" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" /></label></div><label className="block text-sm">URL de imagen (opcional)<input value={form.imagen} onChange={e=>setForm({...form,imagen:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar producto</button></div></form></div>}
    </div>
  );
}