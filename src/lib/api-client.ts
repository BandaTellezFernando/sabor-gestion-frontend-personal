//src/lib/api-client.ts
import { ApiError } from './api-error';
import { STORAGE_KEYS, AUTH_UNAUTHORIZED_EVENT } from './constants';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Cliente HTTP centralizado para Sabor & Gestión.
 * Utiliza fetch nativo, maneja autorización Bearer, errores estándar y serialización JSON.
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private getToken(explicitToken?: string): string | null {
    if (explicitToken) return explicitToken;
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
      } catch {
        return null;
      }
    }
    return null;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  public async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { token: explicitToken, params, headers: customHeaders, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const headers = new Headers(customHeaders);

    const token = this.getToken(explicitToken);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let requestBody: BodyInit | undefined;

    if (body !== undefined && body !== null) {
      if (body instanceof FormData) {
        requestBody = body;
      } else {
        headers.set('Content-Type', 'application/json');
        requestBody = JSON.stringify(body);
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: requestBody,
        ...fetchOptions,
      });
    } catch (error) {
      throw new ApiError(500, error instanceof Error ? error.message : 'Error de conexión con el servidor.');
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { mensaje: response.statusText || 'Error en la respuesta del servidor.' };
      }

      if (response.status === 401 && typeof window !== 'undefined') {
        try {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
        } catch {
          // Noop
        }
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
      }

      throw new ApiError(response.status, errorData);
    }

    if (response.status === 204) {
      return null as unknown as T;
    }

    return (await response.json()) as T;
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, options);
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'POST', body, options);
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body, options);
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', body, options);
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, options);
  }
}

export const apiClient = new ApiClient(BASE_URL);
