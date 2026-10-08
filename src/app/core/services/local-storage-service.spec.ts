import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage-service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('guarda, lee y borra valores', () => {
    service.set('clave', 'valor');
    expect(service.get('clave')).toBe('valor');

    service.remove('clave');
    expect(service.get('clave')).toBeNull();
  });

  it('no lanza si el almacenamiento no está disponible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Lleno', 'QuotaExceededError');
    });

    expect(() => service.set('clave', 'valor')).not.toThrow();
    expect(service.get('clave')).toBeNull();
  });
});
