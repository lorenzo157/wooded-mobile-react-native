import { API } from '../constants/API';
import { authService } from './auth.service';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await authService.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const apiService = {
  async get<T>(path: string): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API}${path}`, { headers });
    if (!response.ok) {
      throw { status: response.status, error: await response.json().catch(() => null) };
    }
    return response.json();
  },

  async post<T>(path: string, body: any): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw { status: response.status, error: await response.json().catch(() => null) };
    }
    return response.json();
  },

  async put<T>(path: string, body: any): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw { status: response.status, error: await response.json().catch(() => null) };
    }
    return response.json();
  },
};
