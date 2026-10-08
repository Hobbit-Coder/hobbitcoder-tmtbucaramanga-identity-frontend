/**
 * Acceso a un almacenamiento del navegador que nunca lanza: en modo privado, con el almacenamiento
 * bloqueado o fuera del navegador, las lecturas devuelven `null` y las escrituras se ignoran.
 */
export abstract class BrowserStorage {
  /** El almacenamiento concreto. Se pide en cada operación porque acceder a él también puede lanzar. */
  protected abstract storage(): Storage | undefined;

  public get(key: string): string | null {
    try {
      return this.storage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  public set(key: string, value: string): void {
    try {
      this.storage()?.setItem(key, value);
    } catch {
      // Sin almacenamiento disponible: el valor solo vive en memoria de quien lo usa.
    }
  }

  public remove(key: string): void {
    try {
      this.storage()?.removeItem(key);
    } catch {
      // Nada que borrar si el almacenamiento no está disponible.
    }
  }
}
