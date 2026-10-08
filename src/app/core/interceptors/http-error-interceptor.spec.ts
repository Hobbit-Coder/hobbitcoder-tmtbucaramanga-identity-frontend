import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { httpErrorInterceptor } from './http-error-interceptor';

describe('httpErrorInterceptor', () => {
  const open = vi.fn();
  let client: HttpClient;
  let http: HttpTestingController;

  async function respondWith(status: number, statusText: string): Promise<void> {
    const response = firstValueFrom(client.get('/api/recurso'));
    http.expectOne('/api/recurso').flush(null, { status, statusText });
    await expect(response).rejects.toMatchObject({ status });
  }

  beforeEach(() => {
    open.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open } },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('avisa de los errores del servidor', async () => {
    await respondWith(503, 'Service Unavailable');

    expect(open).toHaveBeenCalledWith(
      expect.stringContaining('error en el servidor'),
      'Cerrar',
      expect.anything(),
    );
  });

  it('avisa cuando no hay conexión', async () => {
    const response = firstValueFrom(client.get('/api/recurso'));
    http.expectOne('/api/recurso').error(new ProgressEvent('error'));
    await expect(response).rejects.toMatchObject({ status: 0 });

    expect(open).toHaveBeenCalledWith(
      expect.stringContaining('conectar con el servidor'),
      'Cerrar',
      expect.anything(),
    );
  });

  it('deja los errores de negocio a cada página', async () => {
    await respondWith(409, 'Conflict');

    expect(open).not.toHaveBeenCalled();
  });
});
