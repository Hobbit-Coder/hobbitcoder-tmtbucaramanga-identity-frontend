import { Service } from '@angular/core';
import { BrowserStorage } from './browser-storage';

/** `localStorage` seguro: compartido entre pestañas y persistente entre recargas. */
@Service()
export class LocalStorageService extends BrowserStorage {
  protected storage(): Storage | undefined {
    return globalThis.localStorage;
  }
}
