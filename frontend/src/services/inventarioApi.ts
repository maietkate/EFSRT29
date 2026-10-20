import { apiFetch } from './apiClient';

export interface MovimientoKardexApi {
  idMovimiento: number;
  idProducto: number | null;
  tipoMovimiento: string;
  cantidad: number;
  stockAnterior: number;
  stockActual: number;
  motivo: string | null;
  fechaMovimiento: string | null;
  idUsuario: number | null;
}

export interface NuevoMovimientoStock {
  idProducto: number;
  tipoMovimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  motivo: string;
}

const API_URL = 'http://localhost:8080/api/inventario';

export async function obtenerKardexApi(): Promise<MovimientoKardexApi[]> {
  const respuesta = await apiFetch(`${API_URL}/kardex`);

  if (!respuesta.ok) {
    throw new Error('No se pudo consultar el Kardex de SQL Server.');
  }

  return respuesta.json();
}

export async function registrarMovimientoApi(
  movimiento: NuevoMovimientoStock
): Promise<MovimientoKardexApi> {
  const respuesta = await apiFetch(`${API_URL}/movimientos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(movimiento)
  });

  if (!respuesta.ok) {
    let mensaje = 'No se pudo registrar el movimiento.';

    try {
      const datos = await respuesta.json();

      if (typeof datos.error === 'string') {
        mensaje = datos.error;
      } else if (typeof datos.message === 'string') {
        mensaje = datos.message;
      } else if (typeof datos.detail === 'string') {
        mensaje = datos.detail;
      }
    } catch {
      
    }

    throw new Error(mensaje);
  }

  return respuesta.json();
}
