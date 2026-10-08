import { TestBed } from '@angular/core/testing';
import { SessionStorageService } from './session-storage-service';

describe('SessionStorageService', () => {
  let service: SessionStorageService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
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
