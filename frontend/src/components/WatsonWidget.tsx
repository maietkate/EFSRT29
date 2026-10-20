import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { obtenerProductosApi } from '../services/productoApi';
import { obtenerVentasApi } from '../services/ventaApi';
import { shippingService } from '../services/shippingService';
import { authService } from '../services/authService';

type Mensaje = { sender: 'user' | 'bot'; text: string };

export default function WatsonWidget() {
  const [abierto, setAbierto] = useState(false);
  const [escribiendo, setEscribiendo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { sender: 'bot', text: 'Hola. Soy el asistente de AISELL. Puedo consultar el stock, los pedidos y las ventas registradas.' }
  ]);

  const responder = async (texto: string): Promise<string> => {
    const normalizar = (valor: string) => valor.toLocaleLowerCase('es-PE').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const consulta = normalizar(texto);
    if (['stock', 'producto', 'inventario', 'unidad', 'disponib', 'precio', 'cuanto', 'cuanta'].some((palabra) => consulta.includes(palabra))) {
      const productos = await obtenerProductosApi();
      const bajos = productos.filter((p) => p.stock <= (p.stockMinimo ?? 0));
      const buscado = productos.find((p) => consulta.includes(normalizar(p.nombre)));
      if (buscado) return `${buscado.nombre}: ${buscado.stock} unidades disponibles, S/ ${Number(buscado.precio).toFixed(2)} por unidad.`;
      return bajos.length ? `Hay ${bajos.length} productos con stock bajo o agotado: ${bajos.map((p) => `${p.nombre} (${p.stock} und.)`).join(', ')}.` : 'Actualmente no hay productos por debajo de su stock mínimo.';
    }
    if (consulta.includes('pedido') || consulta.includes('envío') || consulta.includes('envio') || consulta.includes('entrega')) {
      const envios = await shippingService.actualizar();
      const pendientes = envios.filter((e) => e.estado === 'Pendiente').length;
      const ruta = envios.filter((e) => e.estado === 'En ruta').length;
      const entregados = envios.filter((e) => e.estado === 'Entregado').length;
      return `Pedidos en SQL Server: ${pendientes} pendientes, ${ruta} en ruta y ${entregados} entregados.`;
    }
    if (consulta.includes('venta') || consulta.includes('ingreso')) {
      if (authService.getCurrentUser()?.rol === 'REPARTIDOR') return 'Tu perfil no tiene permisos para consultar ingresos. Puedes consultar tus pedidos.';
      const ventas = await obtenerVentasApi();
      const hoy = new Date();
      const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      const total = ventas.filter((v) => v.fechaVenta?.substring(0, 10) === fecha && v.estadoVenta?.toLowerCase() === 'completado').reduce((s, v) => s + Number(v.total), 0);
      return `Las ventas completadas de hoy suman S/ ${total.toFixed(2)} en SQL Server.`;
    }
    return 'Puedes preguntarme por stock crítico, inventario, pedidos pendientes, envíos o ventas del día.';
  };

  const enviar = async (texto?: string) => {
    const consulta = (texto ?? escribiendo).trim();
    if (!consulta || ocupado) return;
    setMensajes((anteriores) => [...anteriores, { sender: 'user', text: consulta }]);
    setEscribiendo('');
    setOcupado(true);
    try {
      const respuesta = await responder(consulta);
      setMensajes((anteriores) => [...anteriores, { sender: 'bot', text: respuesta }]);
    } catch {
      setMensajes((anteriores) => [...anteriores, { sender: 'bot', text: 'No pude consultar SQL Server. Comprueba que Spring Boot esté funcionando e inténtalo nuevamente.' }]);
    } finally {
      setOcupado(false);
    }
  };

  return createPortal(
    <div className="fixed bottom-5 right-5 print:hidden" style={{ zIndex: 2147483000 }}>
      {!abierto ? (
        <button type="button" onClick={() => setAbierto(true)} aria-label="Abrir asistente AISELL" className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center">
          <MessageSquare className="w-6 h-6" />
        </button>
      ) : (
        <div className="w-[min(92vw,384px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[460px]">
          <div className="bg-blue-600 p-4 text-white flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2"><Bot className="w-5 h-5" /><span className="font-semibold">Asistente AISELL</span></div>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar asistente"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs" aria-live="polite">
            {mensajes.map((mensaje, indice) => (
              <div key={indice} className={`flex ${mensaje.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl ${mensaje.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-800'}`}>{mensaje.text}</div>
              </div>
            ))}
            {ocupado && <p className="text-slate-500">Consultando datos...</p>}
          </div>
          <div className="flex gap-2 p-2 bg-white border-t overflow-x-auto">
            <button type="button" disabled={ocupado} onClick={() => enviar('Stock crítico')} className="text-xs px-3 py-1.5 bg-slate-100 rounded-full whitespace-nowrap">Stock crítico</button>
            <button type="button" disabled={ocupado} onClick={() => enviar('Estado de pedidos')} className="text-xs px-3 py-1.5 bg-slate-100 rounded-full whitespace-nowrap">Estado de pedidos</button>
            <button type="button" disabled={ocupado} onClick={() => enviar('Ventas de hoy')} className="text-xs px-3 py-1.5 bg-slate-100 rounded-full whitespace-nowrap">Ventas de hoy</button>
          </div>
          <div className="p-3 bg-white border-t flex gap-2 rounded-b-2xl">
            <input type="text" value={escribiendo} onChange={(e) => setEscribiendo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') enviar(); }} placeholder="Escribe tu consulta" className="flex-1 min-w-0 border rounded-xl px-3 py-2 text-sm" />
            <button type="button" disabled={ocupado} onClick={() => enviar()} aria-label="Enviar mensaje" className="p-2 bg-blue-600 text-white rounded-xl disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}