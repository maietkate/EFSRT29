import { apiFetch } from './apiClient';

const API_URL = 'http://localhost:8080/api/incidencias';

export type EstadoTicket = 'Pendiente' | 'En revisión' | 'Resuelto';

export interface TicketApi {
  id: string;
  usuarioId: number;
  nombre: string;
  rol: string;
  telefono: string;
  motivo: string;
  pedidoId: string | null;
  descripcion: string;
  estado: EstadoTicket;
  fecha: string;
}

export async function listarIncidencias(): Promise<TicketApi[]> {
  const respuesta = await apiFetch(API_URL);
  if (!respuesta.ok) throw new Error('No se pudieron consultar las incidencias.');
  return respuesta.json();
}

export async function crearIncidencia(datos: { telefono: string; motivo: string; pedidoId?: string | null; descripcion: string }): Promise<TicketApi> {
  const respuesta = await apiFetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!respuesta.ok) throw new Error('No se pudo guardar la incidencia en SQL Server.');
  return respuesta.json();
}

export async function actualizarEstadoIncidencia(id: string, estado: EstadoTicket): Promise<TicketApi> {
  const respuesta = await apiFetch(`${API_URL}/${encodeURIComponent(id)}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado })
  });
  if (!respuesta.ok) throw new Error('No se pudo actualizar la incidencia.');
  return respuesta.json();
}
