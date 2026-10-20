export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('aisell_token');
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401 && !input.endsWith('/api/auth/login')) {
    window.dispatchEvent(new Event('aisell-sesion-expirada'));
  }
  return response;
}
