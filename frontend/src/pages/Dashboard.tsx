import { useEffect, useState } from 'react';

import { 
  History,

  LayoutDashboard, 

  ShoppingCart, 

  Package, 

  Truck, 

  BarChart3, 

  Search, 

  Bell, 

  LogOut, 

  TrendingUp,  

  ChevronRight,

  
    MessageCircleQuestion,
    Headset,
    
} from 'lucide-react';



import { authService } from '../services/authService';

import { shippingService } from '../services/shippingService';
import type { Envio } from '../services/shippingService';


import { obtenerVentasApi } from '../services/ventaApi';
import type { VentaApi } from '../services/ventaApi';


import { obtenerProductosApi } from '../services/productoApi';
import type { ProductoApi } from '../services/productoApi';




import type { User } from '../types/auth';

import Pos from './Pos';


import InventarioSQL from './InventarioSQL';
import KardexSQL from './KardexSQL';
import Shipping from './Shipping';

import Reports from './Reports';
import CentroIncidencias from './CentroIncidencias';
import CentroAyudaVendedor from './CentroAyudaVendedor';

interface DashboardProps {

  onLogout: () => void;

}

export default function Dashboard({ onLogout }: DashboardProps) {

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'inventory-sql' | 'kardex-sql' | 'shipping' | 'reports' | 'incidencias' | 'ayuda'>('dashboard');
  
const [ventasSQL, setVentasSQL] = useState<VentaApi[]>([]);

const [productosSQL, setProductosSQL] = useState<ProductoApi[]>([]);

const [envios, setEnvios] = useState<Envio[]>([]);

useEffect(() => {
  if (activeTab !== 'dashboard') return;
  const actualizarEnvios = () => {
    setEnvios(shippingService.listar());
  };

  shippingService.actualizar().catch((error) => console.error('No se pudieron actualizar envíos:', error));

  window.addEventListener('aisell-envios-actualizados', actualizarEnvios);
  window.addEventListener('storage', actualizarEnvios);

  return () => {
    window.removeEventListener('aisell-envios-actualizados', actualizarEnvios);
    window.removeEventListener('storage', actualizarEnvios);
  };
}, [activeTab]);



useEffect(() => {
  if (activeTab !== 'dashboard') return;
  const cargarProductos = async () => {
    try {
      const productos = await obtenerProductosApi();
      setProductosSQL(productos);
    } catch (error) {
      console.error('Error al cargar productos de SQL Server:', error);
    }
  };

  cargarProductos();
}, [activeTab]);


useEffect(() => {
  if (activeTab !== 'dashboard') return;
  const cargarVentas = async () => {
    try {
      const ventas = await obtenerVentasApi();
      setVentasSQL(ventas);
    } catch (error) {
      console.error('Error al cargar las ventas de SQL Server:', error);
    }
  };

  cargarVentas();
}, [activeTab]);



 
  

  const [panel, setPanel] = useState<'search' | 'notifications' | 'profile' | null>(null);

  const [globalSearch, setGlobalSearch] = useState('');

  const [profileForm, setProfileForm] = useState({ nombre: '', email: '' });

  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {

    const currentUser = authService.getCurrentUser();

    setUser(currentUser);

    setProfileForm({ nombre: currentUser?.nombre ?? '', email: currentUser?.email ?? '' });

  }, []);


const totalVentasHoy = ventasSQL
  .filter((venta) => {
    if (!venta.fechaVenta) return false;

    const fecha = venta.fechaVenta.substring(0, 10);
    const hoy = new Date();
    const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    return fecha === fechaHoy &&
      venta.estadoVenta?.toLowerCase() === 'completado';
  })
  .reduce((total, venta) => total + venta.total, 0);

  
const productosBajoStock = productosSQL.filter(
  (producto) =>
    producto.stock <= (producto.stockMinimo ?? 0)
).length;

const productosAgotados = productosSQL.filter(
  (producto) => producto.stock === 0
).length;

  

const totalVentasUltimos7Dias = ventasSQL
  .filter((venta) => {
    if (!venta.fechaVenta) return false;
    if (venta.estadoVenta?.toLowerCase() !== 'completado') return false;

    const fechaVenta = new Date(venta.fechaVenta.substring(0, 10) + 'T00:00:00');

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const hace6Dias = new Date(hoy);
    hace6Dias.setDate(hoy.getDate() - 6);

    return fechaVenta >= hace6Dias && fechaVenta <= hoy;
  })
  .reduce((total, venta) => total + venta.total, 0);
  


const ventasPorDia = Array.from({ length: 7 }, (_, indice) => {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() - (6 - indice));

  const fechaTexto = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

  const total = ventasSQL
    .filter(
      (venta) =>
        venta.fechaVenta?.substring(0, 10) === fechaTexto &&
        venta.estadoVenta?.toLowerCase() === 'completado'
    )
    .reduce((suma, venta) => suma + venta.total, 0);

  return {
    day: fecha.toLocaleDateString('es-PE', { weekday: 'short' }),
    total
  };
});

const ventaMaximaDia = Math.max(
  ...ventasPorDia.map((item) => item.total),
  0
);



const pedidosEnRuta = envios.filter(
  (envio) => envio.estado === 'En ruta'
).length;

const pedidosPendientes = envios.filter(
  (envio) => envio.estado === 'Pendiente'
).length;
  

const getGreeting = () => {

    if (!user) return 'Bienvenido a Aisell';

    const primerNombre = user.nombre.split(' ')[0]; 

    if (user.rol === 'ADMIN') {

      return `Bienvenido Administrador ${primerNombre}`;

    } else {

      return `Bienvenido Vendedor ${primerNombre}`;

    }

  };

  const getInitials = (name: string) => {

    return name

      .split(' ')

      .map((n) => n[0])

      .join('')

      .substring(0, 2)

      .toUpperCase();

  };

  return (

    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">

      

      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 sticky top-0 h-screen">

        <div>

          

          <div className="flex items-center gap-2.5 px-3 py-4 mb-6">

            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-500/20 font-bold text-lg">

              AI

            </div>

            <span className="text-2xl font-bold tracking-tight text-slate-900">Aisell</span>

          </div>

          

          <div className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">

            Menú Principal

          </div>

          <nav className="space-y-1">

            <button

              type="button"

              onClick={() => setActiveTab('dashboard')}

              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${

                activeTab === 'dashboard'

                  ? 'bg-blue-50 text-blue-600'

                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'

              }`}

            >

              <LayoutDashboard className="w-5 h-5" />

              <span>Panel de control</span>

            </button>

            <button

              type="button"

              onClick={() => setActiveTab('pos')}

              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${

                activeTab === 'pos'

                  ? 'bg-blue-50 text-blue-600'

                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'

              }`}

            >

              <ShoppingCart className="w-5 h-5" />

              <span>Ventas (POS)</span>

            </button>

            <button

              type="button"

              
onClick={() => setActiveTab('inventory-sql')}


              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${

                
activeTab === 'inventory-sql'


                  ? 'bg-blue-50 text-blue-600'

                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'

              }`}

            >

              <Package className="w-5 h-5" />

              
<span>Inventario</span>
</button>




{user?.rol === 'ADMIN' && (
  <button
    type="button"
    onClick={() => {
      setActiveTab('kardex-sql');
      setPanel(null);
    }}
    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
      activeTab === 'kardex-sql'
        ? 'bg-blue-50 text-blue-600'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <History className="w-5 h-5" />
    <span>Kardex SQL</span>
  </button>
)}

<button
  type="button"
  onClick={() => setActiveTab('shipping')}



              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${

                activeTab === 'shipping'

                  ? 'bg-blue-50 text-blue-600'

                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'

              }`}

            >

              <div className="flex items-center gap-3">

                <Truck className="w-5 h-5" />

    

                <span>Envíos</span>

              </div>

              
{pedidosPendientes > 0 && (
  <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
    {pedidosPendientes}
  </span>
)}


            </button>

            <button

              type="button"

              onClick={() => setActiveTab('reports')}

              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${

                activeTab === 'reports'

                  ? 'bg-blue-50 text-blue-600'

                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'

              }`}

            >

              <BarChart3 className="w-5 h-5" />

                            <span>Reportes</span>
            </button>

            {user?.rol === 'VENDEDOR' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ayuda');
                  setPanel(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'ayuda'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Headset className="w-5 h-5" />
                <span>Centro de ayuda</span>
              </button>
            )}

            {user?.rol === 'ADMIN' && (
              <button
                type="button"
                onClick={() => { setActiveTab('incidencias'); setPanel(null); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'incidencias'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Headset className="w-5 h-5" />
                <span>Centro de incidencias</span>
              </button>
            )}

          </nav>

        </div>

        

        <div className="space-y-4">

          <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl">

            <div className="bg-blue-600/10 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mb-2">

              <MessageCircleQuestion className="w-5 h-5" />

            </div>

            <h4 className="text-xs font-bold text-slate-900 mb-1">¿Necesitas ayuda?</h4>

            <p className="text-xs text-slate-500 mb-2">Soporte técnico integrado.</p>

            <button
                type="button"
                onClick={() => {
                  if (user?.rol === 'ADMIN') {
                    setActiveTab('incidencias');
                    setPanel(null);
                  } else {
                    setActiveTab('ayuda');
                    setPanel(null);
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {user?.rol === 'ADMIN' ? 'Centro de incidencias' : 'Centro de ayuda'}
              </button>

          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 bg-blue-100 text-blue-700 font-semibold rounded-full flex items-center justify-center text-xs">

                {user ? getInitials(user.nombre) : 'US'}

              </div>

              <div className="overflow-hidden">

                <p className="text-xs font-bold text-slate-900 truncate">

                  {user ? user.nombre : 'Cargando...'}

                </p>

                <p className="text-[11px] text-slate-400 capitalize">

                  {user ? (user.rol === 'ADMIN' ? 'Administrador' : 'Vendedor') : ''}

                </p>

              </div>

            </div>

            <button

              onClick={onLogout}

              title="Cerrar sesión"

              className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"

            >

              <LogOut className="w-4 h-4" />

            </button>

          </div>

        </div>

      </aside>

      

      <main className="flex-1 flex flex-col min-w-0">

        

        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">

          <div className="text-xs text-slate-400">

            Aisell / <span className="text-slate-700 font-medium capitalize">

              {activeTab === 'dashboard' ? 'Panel de control' : activeTab === 'incidencias' ? 'Centro de incidencias' : activeTab === 'ayuda' ? 'Centro de ayuda' : activeTab}

            </span>

          </div>

          <div className="flex items-center gap-4">

            <button type="button" title="Buscar registros" onClick={() => setPanel(panel === 'search' ? null : 'search')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">

              <Search className="w-5 h-5" />

            </button>

            <button type="button" title="Notificaciones" onClick={() => setPanel(panel === 'notifications' ? null : 'notifications')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative">

              <Bell className="w-5 h-5" />

              <span className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-2"></span>

            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            <button type="button" title="Perfil de usuario" onClick={() => setPanel(panel === 'profile' ? null : 'profile')} className="flex items-center gap-3 text-left">

              <div className="w-9 h-9 bg-blue-100 text-blue-700 font-semibold rounded-full flex items-center justify-center text-xs">

                {user ? getInitials(user.nombre) : 'US'}

              </div>

              <div className="text-left hidden sm:block">

                <p className="text-xs font-bold text-slate-900">{user?.nombre}</p>

                <p className="text-[11px] text-slate-400">

                  {user?.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}

                </p>

              </div>

            </button>

          </div>

        </header>

        {panel && <div className="mx-8 mt-4 bg-white border border-slate-200 rounded-xl shadow-sm p-5">

          <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-slate-900">{panel === 'search' ? 'Buscar registros' : panel === 'notifications' ? 'Notificaciones' : panel === 'profile' ? 'Perfil de usuario' : 'Centro de ayuda'}</h2><button type="button" onClick={() => setPanel(null)} className="text-slate-500 hover:text-slate-900">Cerrar ✕</button></div>

          {panel === 'search' && <><input autoFocus value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="Buscar productos, ventas o envíos..." className="w-full border rounded-lg px-3 py-2 text-sm"/><div className="flex gap-2 flex-wrap mt-3"><button 
onClick={() => {
  setActiveTab('inventory-sql');
  setPanel(null);
}}
 className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">Buscar productos en inventario</button><button onClick={() => {setActiveTab('reports');setPanel(null)}} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">Consultar ventas</button><button onClick={() => {setActiveTab('shipping');setPanel(null)}} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">Consultar envíos</button></div><p className="text-xs text-slate-500 mt-2">Término: {globalSearch || 'Escribe para buscar en el módulo correspondiente.'}</p></>}

          {panel === 'notifications' && <div className="text-sm text-slate-600 space-y-2"><p>• Revisa los productos con stock bajo desde Inventario.</p><p>• Las ventas registradas aparecen en Reportes.</p><p>• Consulta los pedidos pendientes en Envíos.</p><button 
onClick={() => {
  setActiveTab('inventory-sql');
  setPanel(null);
}}
 className="px-3 py-2 bg-blue-600 text-white rounded-lg">Revisar inventario</button></div>}

          {panel === 'profile' && <form onSubmit={async e => { e.preventDefault(); if (!user) return; try { const updatedUser = await authService.actualizarPerfil(profileForm.nombre.trim(), profileForm.email.trim()); setUser(updatedUser); setProfileMessage('Datos actualizados en SQL Server.'); } catch (error) { setProfileMessage(error instanceof Error ? error.message : 'No se pudo guardar el perfil.'); } }} className="space-y-3 text-sm text-slate-600"><label className="block">Nombre completo<input required value={profileForm.nombre} onChange={e => setProfileForm({ ...profileForm, nombre: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" /></label><label className="block">Correo electrónico<input required type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" /></label><p><b>Rol:</b> {user?.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}</p>{profileMessage && <p role="status" className="text-emerald-700">{profileMessage}</p>}<div className="flex flex-wrap gap-2"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Actualizar datos</button><button type="button" onClick={() => {setPanel(null);onLogout()}} className="px-3 py-2 bg-red-600 text-white rounded-lg">Cerrar sesión</button></div></form>}



        </div>}

        

        {activeTab === 'pos' && <Pos />}

        

        {activeTab === 'inventory-sql' && <InventarioSQL soloLectura={user?.rol !== 'ADMIN'} />}
        
        {activeTab === 'kardex-sql' && user?.rol === 'ADMIN' && <KardexSQL />}


        {activeTab === 'shipping' && <Shipping />}

        {activeTab === 'reports' && <Reports />}

        {activeTab === 'incidencias' && user?.rol === 'ADMIN' && <CentroIncidencias />}

        {activeTab === 'ayuda' && user?.rol === 'VENDEDOR' && <CentroAyudaVendedor />}

        

        {activeTab === 'dashboard' && (

          <div className="p-8 space-y-6">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

              <div>

               
<p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
  {new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })}
</p>


                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">

                  {getGreeting()}

                </h1>

                <p className="text-sm text-slate-500 mt-1">

                  Aquí tienes el resumen de tu negocio hoy.

                </p>

              </div>

              <button 

                onClick={() => setActiveTab('reports')}

                className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-medium text-xs px-4 py-2.5 rounded-xl shadow-xs hover:bg-slate-50 transition-colors cursor-pointer self-start md:self-auto"

              >

                <span>Descargar reporte</span>

                <ChevronRight className="w-4 h-4" />

              </button>

            </div>

            

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">

                <div className="flex items-center justify-between mb-4">

                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">

                    <TrendingUp className="w-5 h-5" />

                  </div>

                

                </div>

                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">

                  Ventas totales del día

                </p>

                
<h3 className="text-2xl font-bold text-slate-900">
  S/ {totalVentasHoy.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}
</h3>


                

              </div>

              <div 

                
onClick={() => setActiveTab('inventory-sql')}


                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs cursor-pointer hover:border-red-200 transition-all"

              >

                <div className="flex items-center justify-between mb-4">

                  <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">

                    <Package className="w-5 h-5" />

                  </div>

                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">

                    Requiere atención

                  </span>

                </div>

                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">

                  Productos bajo stock

                </p>

                
<h3 className="text-2xl font-bold text-slate-900">
  {productosBajoStock} productos
</h3>


                
<p className="text-xs text-slate-400 mt-2">
  {productosAgotados} productos agotados
</p>


              </div>

              <div 

                onClick={() => setActiveTab('shipping')}

                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs cursor-pointer hover:border-amber-200 transition-all"

              >

                <div className="flex items-center justify-between mb-4">

                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">

                    <Truck className="w-5 h-5" />

                  </div>

                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">

                    Hoy

                  </span>

                </div>

                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">

                  Pedidos en ruta

                </p>

                
<h3 className="text-2xl font-bold text-slate-900">
  {pedidosEnRuta} pedidos
</h3>


                
<p className="text-xs text-slate-400 mt-2">
  {pedidosPendientes} pedidos pendientes
</p>

              </div>

            </div>

            

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">

                <div className="flex items-center justify-between mb-6">

                  <div>

                    <h3 className="text-base font-bold text-slate-900">Resumen de ventas</h3>

                    <p className="text-xs text-slate-400">Rendimiento de los últimos 7 días</p>

                  </div>

                  <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    Últimos 7 días
                  </span>

                </div>

                <div className="mb-6">

                  
<span className="text-2xl font-bold text-slate-900">
  S/ {totalVentasUltimos7Dias.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}
</span>


                  

                </div>

                <div className="h-44 flex items-end justify-between gap-3 pt-6 border-t border-slate-100">

                  
{ventasPorDia.map((item, idx) => (


                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">

                      <div

                        
style={{
  height: ventaMaximaDia > 0
    ? `${(item.total / ventaMaximaDia) * 100}%`
    : '0%'
}}


                        className="w-full bg-blue-600 rounded-t-lg transition-all hover:bg-blue-700"

                      ></div>

                      <span className="text-xs text-slate-400 font-medium">{item.day}</span>

                    </div>

                  ))}

                </div>

              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">

                <div>

                  <h3 className="text-base font-bold text-slate-900">Accesos rápidos</h3>

                  <p className="text-xs text-slate-400 mb-5">Operaciones frecuentes</p>

                  <div className="space-y-3">

                    <button

                      type="button"

                      onClick={() => setActiveTab('pos')}

                      className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 rounded-xl transition-all group cursor-pointer text-left"

                    >

                      <div className="flex items-center gap-3">

                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">

                          <ShoppingCart className="w-4 h-4" />

                        </div>

                        <div>

                          <p className="text-xs font-bold text-slate-900">Nueva venta</p>

                          <p className="text-[11px] text-slate-400">Ir al punto de venta</p>

                        </div>

                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />

                    </button>

                    <button

                      type="button"

                      
onClick={() => setActiveTab('inventory-sql')}


                      className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 rounded-xl transition-all group cursor-pointer text-left"

                    >

                      <div className="flex items-center gap-3">

                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">

                          <Package className="w-4 h-4" />

                        </div>

                        <div>

                          <p className="text-xs font-bold text-slate-900">Gestionar inventario</p>

                          <p className="text-[11px] text-slate-400">Ver stock y productos</p>

                        </div>

                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />

                    </button>

                    <button

                      type="button"

                      onClick={() => setActiveTab('shipping')}

                      className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 rounded-xl transition-all group cursor-pointer text-left"

                    >

                      <div className="flex items-center gap-3">

                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">

                          <Truck className="w-4 h-4" />

                        </div>

                        <div>

                          <p className="text-xs font-bold text-slate-900">Gestionar envíos</p>

                          <p className="text-[11px] text-slate-400">Ver pedidos en ruta</p>

                        </div>

                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />

                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>

  );

}