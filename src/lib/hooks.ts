import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Lang, Text } from '@/engine/types';

export function useLang(): { lang: Lang; tx: (t: Text | null | undefined) => string } {
  const { i18n } = useTranslation();
  const lang: Lang = i18n.language === 'hi' ? 'hi' : 'en';
  return { lang, tx: (t) => (t ? t[lang] : '') };
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export type AsyncState<T> = { status: 'loading'; data?: T } | { status: 'ready'; data: T } | { status: 'error'; error: Error; data?: T };

/** Run an async call when deps change. Keeps the last data while reloading, so screens don't flicker. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> & { retry: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ status: 'loading', data: s.data }));
    fn().then(
      (data) => live && setState({ status: 'ready', data }),
      (error: unknown) => live && setState((s) => ({ status: 'error', error: error instanceof Error ? error : new Error(String(error)), data: s.data })),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { ...state, retry: () => setN((x) => x + 1) };
}
