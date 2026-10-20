
import { useEffect, useRef, useState } from 'react';

import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  ChevronRight,
  CheckCircle2,
  Truck,
  Store,
  MapPin,
  Phone,
  UserRound
} from 'lucide-react';


import { obtenerProductosPosApi } from '../services/productosPosApi';


import {
  registrarVentaApi,
  buscarVentaPorSolicitudApi
} from '../services/ventaApi';




import type { Product, CartItem } from '../types/pos';
import type { VentaApi, VentaRequestApi } from '../services/ventaApi';

const CLAVE_PENDIENTE = 'aisell_pos_venta_pendiente_v2';

export default function Pos() {

const [products, setProducts] = useState<Product[]>([]);

  

useEffect(() => {
  obtenerProductosPosApi()
    .then((productos) => {
      setProducts(productos);
    })
    .catch((error) => {
      console.error('Error al cargar productos SQL:', error);
      setProducts([]);
    });
}, []);


  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saleSuccess, setSaleSuccess] = useState<boolean>(false);
  const [modalidad, setModalidad] = useState<'recojo' | 'delivery'>('recojo');
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [procesando, setProcesando] = useState(false);
  
const ventaEnProceso = useRef(false);

const idSolicitudVenta = useRef<string | null>(null);

const [ventaPendienteVerificacion, setVentaPendienteVerificacion] = useState(() => localStorage.getItem(CLAVE_PENDIENTE) !== null);



  const [mensajeVenta, setMensajeVenta] = useState('');

  

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.categoria === selectedCategory;
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  
  
const addToCart = (product: Product) => {
  const current = products.find((p) => p.id === product.id);
  const inCart =
    cart.find((item) => item.producto.id === product.id)?.cantidad || 0;

  if (!current || inCart >= current.stock) {
    window.alert(`No hay stock suficiente de ${product.nombre}.`);
    return;
  }

  setCart((prevCart) => {
    const existing = prevCart.find(
      (item) => item.producto.id === product.id
    );

    if (existing) {
      return prevCart.map((item) =>
        item.producto.id === product.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      );
    }

    return [...prevCart, { producto: current, cantidad: 1 }];
  });
};



const updateQuantity = (productId: number, delta: number) => {
  if (delta > 0) {
    const current = products.find((p) => p.id === productId);
    const inCart =
      cart.find((item) => item.producto.id === productId)?.cantidad || 0;

    if (!current || inCart >= current.stock) {
      window.alert('La cantidad supera el stock disponible.');
      return;
    }
  }

  setCart((prevCart) =>
    prevCart
      .map((item) => {
        if (item.producto.id === productId) {
          const newQty = item.cantidad + delta;

          return newQty > 0
            ? { ...item, cantidad: newQty }
            : null;
        }

        return item;
      })
      .filter(Boolean) as CartItem[]
  );
};

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  const subtotal = total / 1.18;
  const igv = total - subtotal;




const finalizarVenta = async (venta: VentaApi, modalidadConfirmada: string) => {
  localStorage.removeItem(CLAVE_PENDIENTE);
  idSolicitudVenta.current = null;
  setVentaPendienteVerificacion(false);
  setMensajeVenta(`Venta ${venta.codigoVenta} registrada en SQL Server. Total: S/ ${Number(venta.total).toFixed(2)}.${modalidadConfirmada === 'delivery' ? ' Pedido delivery creado y pendiente de repartidor.' : ''}`);
  setCart([]);
  setCliente('');
  setTelefono('');
  setDireccion('');
  setModalidad('recojo');
  setSaleSuccess(true);
  try {
    setProducts(await obtenerProductosPosApi());
  } catch {
    setProducts([]);
    window.alert('La venta se confirmó, pero el catálogo no se actualizó. Actualiza el POS antes de vender nuevamente.');
  }
};

const verificarVentaPendiente = async () => {
  if (ventaEnProceso.current) return;
  const pendiente = localStorage.getItem(CLAVE_PENDIENTE);
  if (!pendiente) {
    setVentaPendienteVerificacion(false);
    return;
  }
  ventaEnProceso.current = true;
  setProcesando(true);
  try {
    const solicitud = JSON.parse(pendiente) as VentaRequestApi;
    if (!solicitud.idSolicitud || !Array.isArray(solicitud.detalles)) throw new Error('Datos de venta pendiente inválidos.');
    const existente = await buscarVentaPorSolicitudApi(solicitud.idSolicitud);
    if (existente) {
      await finalizarVenta(existente, solicitud.modalidad || 'recojo');
    } else {
      const registrada = await registrarVentaApi(solicitud);
      await finalizarVenta(registrada, solicitud.modalidad || 'recojo');
    }
  } catch (error) {
    setVentaPendienteVerificacion(true);
    window.alert(error instanceof Error ? error.message : 'No se pudo recuperar la venta. No realices otra operación hasta verificarla.');
  } finally {
    ventaEnProceso.current = false;
    setProcesando(false);
  }
};

const handleProcessSale = async () => {
  if (procesando || ventaEnProceso.current || ventaPendienteVerificacion) return;
  if (cart.length === 0) {
    window.alert('Agrega al menos un producto al carrito.');
    return;
  }
  if (modalidad === 'delivery' && (cliente.trim().length < 2 || !/^9\d{8}$/.test(telefono.trim()) || direccion.trim().length < 8)) {
    window.alert('Para delivery, ingresa el nombre, un celular peruano válido y una dirección completa.');
    return;
  }
  ventaEnProceso.current = true;
  setProcesando(true);
  setSaleSuccess(false);
  try {
    const idSolicitud = crypto.randomUUID();
    idSolicitudVenta.current = idSolicitud;
    const solicitud: VentaRequestApi = {
      idSolicitud,
      idCliente: null,
      idUsuario: null,
      modalidad,
      cliente: modalidad === 'delivery' ? cliente.trim() : null,
      telefono: modalidad === 'delivery' ? telefono.trim() : null,
      direccion: modalidad === 'delivery' ? direccion.trim() : null,
      detalles: cart.map((item) => ({ idProducto: item.producto.id, cantidad: item.cantidad }))
    };
    localStorage.setItem(CLAVE_PENDIENTE, JSON.stringify(solicitud));
    setVentaPendienteVerificacion(true);
    const venta = await registrarVentaApi(solicitud);
    await finalizarVenta(venta, modalidad);
  } catch (error) {
    let recuperada: VentaApi | null = null;
    if (idSolicitudVenta.current) {
      try {
        recuperada = await buscarVentaPorSolicitudApi(idSolicitudVenta.current);
      } catch {
        recuperada = null;
      }
    }
    if (recuperada) {
      await finalizarVenta(recuperada, modalidad);
    } else {
      setVentaPendienteVerificacion(true);
      window.alert(`No se pudo confirmar la venta: ${error instanceof Error ? error.message : 'Error de conexión'}. Utiliza «Verificar / reintentar» antes de volver a vender.`);
    }
  } finally {
    ventaEnProceso.current = false;
    setProcesando(false);
  }
};


  return (
    <div className="p-8 space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
            PUNTO DE VENTA
          </p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Nueva venta
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Selecciona los productos para agregarlos al carrito.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-medium self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>POS conectado a SQL Server</span>
        </div>
      </div>

      
      {saleSuccess && (
        <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <p className="font-bold text-sm">{mensajeVenta}</p>
              <p className="text-xs text-emerald-100">Stock actualizado en el inventario.</p>
            </div>
          </div>
        </div>
      )}

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        
        <div className="lg:col-span-2 space-y-5">
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-xs"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {['Todos', 'Tecnología', 'Oficina', 'Accesorios'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div className="relative h-36 overflow-hidden bg-slate-100">
                  <img
                    src={product.imagen}
                    alt={product.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span
                    className={`absolute top-2.5 left-2.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      product.stock <= 5
                        ? 'bg-red-100 text-red-600'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {product.stock <= 5 ? `Solo ${product.stock}` : `${product.stock} disponibles`}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    {product.categoria}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 truncate">{product.nombre}</h3>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-extrabold text-slate-900">
                      S/ {product.precio.toFixed(2)}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      title="Agregar al carrito"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between h-fit sticky top-20">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Carrito de venta</h2>
                <p className="text-xs text-slate-400">
                  {cart.reduce((acc, item) => acc + item.cantidad, 0)} productos seleccionados
                </p>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-medium text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
            </div>

            
            <div className="py-4 space-y-4 max-h-80 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <ShoppingCart className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">El carrito está vacío</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.producto.id} className="flex items-center justify-between gap-3">
                    <img
                      src={item.producto.imagen}
                      alt={item.producto.nombre}
                      className="w-11 h-11 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.producto.nombre}</p>
                      <p className="text-[11px] text-slate-400">S/ {item.producto.precio.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.producto.id, -1)}
                          className="p-1 text-slate-500 hover:bg-slate-100 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">{item.cantidad}</span>
                        <button
                          onClick={() => updateQuantity(item.producto.id, 1)}
                          className="p-1 text-slate-500 hover:bg-slate-100 rounded-r-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-slate-900 min-w-[55px] text-right">
                        S/ {(item.producto.precio * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            
            <div className="pt-4 border-t border-slate-100 mb-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Modalidad de entrega</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setModalidad('recojo')}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold ${modalidad === 'recojo' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <Store className="w-4 h-4" /> Recojo en tienda
                </button>
                <button type="button" onClick={() => setModalidad('delivery')}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold ${modalidad === 'delivery' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <Truck className="w-4 h-4" /> Delivery
                </button>
              </div>

              {modalidad === 'delivery' ? (
                <div className="space-y-3 rounded-xl bg-blue-50/50 border border-blue-100 p-3">
                  <p className="text-xs text-blue-700 font-semibold">Datos para entregar el pedido</p>
                  <label className="block text-xs font-medium text-slate-700">
                    Nombre del cliente *
                    <div className="relative mt-1">
                      <UserRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input value={cliente} onChange={e => setCliente(e.target.value)} maxLength={100}
                        placeholder="Nombre completo" autoComplete="name"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm" />
                    </div>
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Celular peruano *
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input value={telefono} onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        inputMode="numeric" type="tel" maxLength={9} placeholder="987654321"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm" />
                    </div>
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Dirección de entrega *
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input value={direccion} onChange={e => setDireccion(e.target.value)} maxLength={250}
                        placeholder="Calle, número, distrito, ciudad"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm" />
                    </div>
                  </label>
                  <p className="text-[11px] text-slate-500">Al procesar la venta se generará un envío Pendiente.</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">La venta se registra sin generar un pedido de envío.</p>
              )}
            </div>
          </div>

          
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-700">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>IGV (18%)</span>
                <span className="font-semibold text-slate-700">S/ {igv.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-2xl font-black text-blue-600">S/ {total.toFixed(2)}</span>
            </div>

          
<>
  {saleSuccess && (
    <div
      role="status"
      className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />

        <div>
          <p className="text-sm font-bold text-emerald-800">
            ¡Venta registrada correctamente!
          </p>

          <p className="text-xs text-emerald-700 mt-1">
            {mensajeVenta}
          </p>

          <p className="text-xs text-emerald-600 mt-1">
            Stock actualizado en el inventario.
          </p>
        </div>
      </div>
    </div>
  )}

  {ventaPendienteVerificacion && (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
      <p className="font-semibold">Hay una venta cuya confirmación está pendiente.</p>
      <p className="mt-1">No vuelvas a procesarla con otro identificador. Verifica o reintenta la misma solicitud.</p>
      <button type="button" disabled={procesando} onClick={verificarVentaPendiente} className="mt-3 px-3 py-2 rounded-lg bg-amber-600 text-white disabled:opacity-50">Verificar / reintentar venta pendiente</button>
    </div>
  )}

  <button
    onClick={handleProcessSale}
    


disabled={cart.length === 0 || procesando || ventaPendienteVerificacion}



    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
  >
    <span>{procesando ? 'Procesando...' : 'Procesar venta'}</span>
    <ChevronRight className="w-4 h-4" />
  </button>
</>

           
<p className="text-[10px] text-center text-slate-400">
  Las ventas por recojo y delivery se registran en SQL Server.
</p>

          </div>
        </div>

      </div>
    </div>
  );
}