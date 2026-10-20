import { apiFetch } from './apiClient';
export type EstadoEnvio = 'Pendiente' | 'En ruta' | 'Entregado';

export interface Envio {
  id: string;
  cliente: string;
  direccion: string;
  estado: EstadoEnvio;
  horaEstimada: string;
  productos?: string;
  idVenta?: string;
  telefono?: string;
  repartidorId?: number;
  repartidorNombre?: string;
  fechaAceptacion?: string;
  fechaEntrega?: string;
}

interface EnvioApi {
  idEnvio: number;
  codigoEnvio: string;
  idVenta: number | null;
  estadoEnvio: EstadoEnvio;
  direccionDestino: string;
  clienteNombre: string | null;
  telefono: string | null;
  productos: string | null;
  repartidor: string | null;
  repartidorId: number | null;
  fechaAceptacion: string | null;
  fechaEntrega: string | null;
}

let cache: Envio[] = [];
const API_URL = 'http://localhost:8080/api/envios';

const convertir = (envio: EnvioApi): Envio => ({
  id: envio.codigoEnvio,
  cliente: envio.clienteNombre || 'Cliente no especificado',
  direccion: envio.direccionDestino,
  estado: envio.estadoEnvio,
  horaEstimada: envio.estadoEnvio === 'Entregado' ? 'Entregado' : envio.estadoEnvio === 'En ruta' ? 'En ruta' : 'Pendiente de asignación',
  productos: envio.productos || '',
  idVenta: envio.idVenta != null ? String(envio.idVenta) : undefined,
  telefono: envio.telefono || undefined,
  repartidorId: envio.repartidorId ?? undefined,
  repartidorNombre: envio.repartidor || undefined,
  fechaAceptacion: envio.fechaAceptacion || undefined,
  fechaEntrega: envio.fechaEntrega || undefined
});

const consultar = async <T,>(url: string, opciones?: RequestInit): Promise<T> => {
  const respuesta = await apiFetch(url, opciones);
  if (!respuesta.ok) {
    let texto = `Error HTTP ${respuesta.status} al consultar envíos`;
    try {
      const datos = await respuesta.json();
      texto = datos.detail || datos.message || texto;
    } catch {
      texto = `Error HTTP ${respuesta.status} al consultar envíos`;
    }
    throw new Error(texto);
  }
  return respuesta.json();
};

const notificar = () => window.dispatchEvent(new Event('aisell-envios-actualizados'));

export const shippingService = {
  listar: (): Envio[] => cache,
  actualizar: async (): Promise<Envio[]> => {
    const respuesta = await consultar<EnvioApi[]>(API_URL);
    ids.clear();
    respuesta.forEach((envio) => ids.set(envio.codigoEnvio, envio.idEnvio));
    cache = respuesta.map(convertir);
    notificar();
    return cache;
  },
  aceptar: async (id: string, repartidorId: number, repartidorNombre: string): Promise<boolean> => {
    const pedido = cache.find((e) => e.id === id);
    if (!pedido) throw new Error('Pedido no encontrado en el listado. Actualiza la página.');
    await consultar(`${API_URL}/${encodeURIComponent(idId(pedido))}/aceptar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repartidorId, repartidorNombre })
    });
    await shippingService.actualizar();
    return true;
  },
  entregar: async (id: string, repartidorId: number): Promise<boolean> => {
    const pedido = cache.find((e) => e.id === id);
    if (!pedido) throw new Error('Pedido no encontrado en el listado. Actualiza la página.');
    await consultar(`${API_URL}/${encodeURIComponent(idId(pedido))}/entregar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repartidorId })
    });
    await shippingService.actualizar();
    return true;
  },
  pendientes: (): Envio[] => cache.filter((e) => e.estado === 'Pendiente'),
  misEntregas: (repartidorId: number): Envio[] => cache.filter((e) => e.repartidorId === repartidorId)
};

const ids = new Map<string, number>();
function idId(pedido: Envio): string {
  const id = ids.get(pedido.id);
  if (id == null) throw new Error('El envío no tiene identificador SQL. Actualiza los datos.');
  return String(id);
}
