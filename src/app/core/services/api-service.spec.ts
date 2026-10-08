import { HttpParams, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ProblemDetails } from '../models/problem-details';
import { ApiService } from './api-service';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => http.verify());

  it('envía los parámetros de consulta en Get', async () => {
    const response = firstValueFrom(
      service.Get<unknown[]>('/api/users', new HttpParams().set('status', 1)),
    );

    const request = http.expectOne('/api/users?status=1');
    expect(request.request.method).toBe('GET');
    request.flush([]);
    await expect(response).resolves.toEqual([]);
  });

  it('envía el cuerpo en Post', async () => {
    const response = firstValueFrom(
      service.Post<{ email: string }, { id: string }>('/api/users', { email: 'ana@example.com' }),
    );

    const request = http.expectOne('/api/users');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ana@example.com' });
    request.flush({ id: '123' });
    await expect(response).resolves.toEqual({ id: '123' });
  });

  it('propaga el ProblemDetails que responde la API', async () => {
    const problem: ProblemDetails = {
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
      title: 'Not Found',
      status: 404,
      detail: 'El usuario no existe.',
      instance: '/api/users/123',
      errors: {},
    };
    const response = firstValueFrom(service.Delete('/api/users/123'));

    http.expectOne('/api/users/123').flush(problem, { status: 404, statusText: 'Not Found' });
    await expect(response).rejects.toEqual(problem);
  });

  it('si la respuesta no trae ProblemDetails, arma uno con el código HTTP', async () => {
    const response = firstValueFrom(service.Get('/api/users'));

    http.expectOne('/api/users').flush(null, { status: 401, statusText: 'Unauthorized' });
    await expect(response).rejects.toMatchObject({ status: 401, title: 'Error HTTP 401' });
  });
});
