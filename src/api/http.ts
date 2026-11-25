import type { Scheme } from '@/engine/types';
import type { NextRequest, NextResponse, SchemeApi, ScreenRequest, ScreenResponse } from './types';

/**
 * Calls the FastAPI service at VITE_API_URL. Same request/response types as the local adapter.
 *   GET  /schemes          -> Scheme[]
 *   GET  /schemes/{id}     -> Scheme (404 -> null)
 *   POST /screen           ScreenRequest -> ScreenResponse
 *   POST /next             NextRequest   -> NextResponse
 */
export function createHttpApi(baseUrl: string): SchemeApi {
  const url = (p: string) => baseUrl.replace(/\/$/, '') + p;
  async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url(path), { headers: { 'Content-Type': 'application/json' }, ...init });
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return (await res.json()) as T;
  }
  return {
    mode: 'http',
    listSchemes: () => call<Scheme[]>('/schemes'),
    async getScheme(id) {
      try {
        return await call<Scheme>(`/schemes/${encodeURIComponent(id)}`);
      } catch (e) {
        if (String(e).includes('HTTP 404')) return null;
        throw e;
      }
    },
    screen: (req: ScreenRequest) => call<ScreenResponse>('/screen', { method: 'POST', body: JSON.stringify(req) }),
    next: (req: NextRequest) => call<NextResponse>('/next', { method: 'POST', body: JSON.stringify(req) }),
  };
}
