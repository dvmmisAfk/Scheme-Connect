import { createHttpApi } from './http';
import { localApi } from './local';
import type { SchemeApi } from './types';

export type * from './types';

/** VITE_API_MODE=local (default) | http. http needs VITE_API_URL. */
export const api: SchemeApi =
  import.meta.env.VITE_API_MODE === 'http' ? createHttpApi(import.meta.env.VITE_API_URL ?? 'http://localhost:8000') : localApi;
