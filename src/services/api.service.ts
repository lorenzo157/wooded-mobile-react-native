import { API } from "../constants/API";
import { authService } from "./auth.service";

const TIMEOUT_MS = 8000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch {
    throw { status: 0, error: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await authService.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const apiService = {
  async get<T>(path: string): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API}${path}`, { headers });
    if (!response.ok) {
      throw {
        status: response.status,
        error: await response.json().catch(() => null),
      };
    }
    return response.json();
  },

  async post<T>(path: string, body: any): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw {
        status: response.status,
        error: await response.json().catch(() => null),
      };
    }
    return response.json();
  },

  async put<T>(path: string, body: any): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(`${API}${path}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw {
        status: response.status,
        error: await response.json().catch(() => null),
      };
    }
    return response.json();
  },
};
