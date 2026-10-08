import { Service } from '@angular/core';
import { BrowserStorage } from './browser-storage';

/** `sessionStorage` seguro: solo de esta pestaña y se borra al cerrarla. */
@Service()
export class SessionStorageService extends BrowserStorage {
  protected storage(): Storage | undefined {
    return globalThis.sessionStorage;
  }
}
