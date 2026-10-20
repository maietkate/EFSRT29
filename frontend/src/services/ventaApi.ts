import { apiFetch } from './apiClient';

export interface DetalleVentaRequestApi {
  idProducto: number;
  cantidad: number;
}


export interface VentaRequestApi {
  idSolicitud: string;
  idCliente: number | null;
  idUsuario: number | null;
  detalles: DetalleVentaRequestApi[];
  modalidad?: 'recojo' | 'delivery';
  cliente?: string | null;
  telefono?: string | null;
  direccion?: string | null;
}


export interface VentaApi {
  idVenta: number;
  codigoVenta: string;
  
idSolicitud: string | null;

  fechaVenta: string | null;
  idCliente: number | null;
  idUsuario: number | null;
  subtotal: number;
  igv: number;
  total: number;
  estadoVenta: string | null;
}

const API_URL = 'http://localhost:8080/api/ventas';

export async function obtenerVentasApi(): Promise<VentaApi[]> {
  const respuesta = await apiFetch(API_URL);

  if (!respuesta.ok) {
    throw new Error('No se pudieron consultar las ventas de SQL Server.');
  }

  return respuesta.json();
}

export async function registrarVentaApi(
  venta: VentaRequestApi
): Promise<VentaApi> {
  const respuesta = await apiFetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(venta)
  });

  if (!respuesta.ok) {
    let mensaje = 'No se pudo registrar la venta.';

    try {
      const datos = await respuesta.json();

      if (typeof datos.error === 'string') {
        mensaje = datos.error;
      } else if (typeof datos.detail === 'string') {
        mensaje = datos.detail;
      } else if (typeof datos.message === 'string') {
        mensaje = datos.message;
      }
    } catch {
      mensaje = 'No se pudo registrar la venta.';
    }

    throw new Error(mensaje);
  }

  return respuesta.json();
}

export async function buscarVentaPorSolicitudApi(
  idSolicitud: string
): Promise<VentaApi | null> {
  const respuesta = await apiFetch(
    `${API_URL}/solicitud/${encodeURIComponent(idSolicitud)}`
  );

  if (respuesta.status === 404) {
    return null;
  }

  if (!respuesta.ok) {
    throw new Error(
      'No se pudo comprobar el estado de la venta en SQL Server.'
    );
  }

  return respuesta.json();
}

export interface DetalleVentaApi {
  idDetalle: number;
  idVenta: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export async function obtenerDetallesVentaApi(idVenta: number): Promise<DetalleVentaApi[]> {
  const respuesta = await apiFetch(`${API_URL}/${idVenta}/detalles`);
  if (!respuesta.ok) throw new Error(`No se pudieron consultar los detalles de la venta ${idVenta}.`);
  return respuesta.json();
}
