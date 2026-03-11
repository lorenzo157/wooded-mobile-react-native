import { API } from '../constants/API';
import { LoginResponse, DecodedToken, User } from '../types/auth.types';
import { storageService } from './storage.service';
import { jwtDecode } from 'jwt-decode';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response: Response;
    try {
      response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
    } catch {
      throw { status: 0, error: null };
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw { status: response.status, error };
    }

    const data: LoginResponse = await response.json();
    await storageService.set('token', data.access_token);
    await storageService.set('user', data.user);
    return data;
  },

  async logout(): Promise<void> {
    await storageService.clear();
  },

  async getUser(): Promise<User | null> {
    return storageService.get<User>('user');
  },

  async getToken(): Promise<string | null> {
    return storageService.get<string>('token');
  },

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp - now < 3;
    } catch {
      return true;
    }
  },
};
