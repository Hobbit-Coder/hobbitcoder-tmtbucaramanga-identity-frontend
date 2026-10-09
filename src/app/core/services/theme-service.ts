import { DestroyRef, inject, Service, signal } from '@angular/core';
import { LocalStorageService } from './local-storage-service';

export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * Tema claro u oscuro (manual §11). La preferencia (Sistema, Claro u Oscuro) se guarda en este navegador y el
 * tema efectivo se aplica en `<html data-theme>`, de donde lo leen los tokens, Material y Tailwind, incluidos
 * menús, diálogos y demás overlays.
 */
@Service()
export class ThemeService {
  private readonly _storageKey = 'tmt-bucaramanga.theme';
  private readonly _storage = inject(LocalStorageService);
  private readonly _media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');

  public readonly preference = signal<ThemePreference>(this.read());
  public readonly isDark = signal(false);

  constructor() {
    const onSystemChange = () => this.apply();

    this._media?.addEventListener('change', onSystemChange);
    inject(DestroyRef).onDestroy(() => this._media?.removeEventListener('change', onSystemChange));
    this.apply();
  }

  public set(preference: ThemePreference): void {
    this._storage.set(this._storageKey, preference);
    this.preference.set(preference);
    this.apply();
  }

  /** Alterna entre claro y oscuro (botón de la barra superior). */
  public toggle(): void {
    this.set(this.isDark() ? 'light' : 'dark');
  }

  private apply(): void {
    const preference = this.preference();
    const dark =
      preference === 'dark' || (preference === 'system' && this._media?.matches === true);

    this.isDark.set(dark);
    globalThis.document?.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }

  private read(): ThemePreference {
    const stored = this._storage.get(this._storageKey);

    return stored === 'light' || stored === 'dark' ? stored : 'system';
  }
}
