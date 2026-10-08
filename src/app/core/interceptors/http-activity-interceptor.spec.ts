import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { HttpActivityService } from '../services/http-activity-service';
import { httpActivityInterceptor } from './http-activity-interceptor';

describe('httpActivityInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let activity: HttpActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpActivityInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    activity = TestBed.inject(HttpActivityService);
  });

  afterEach(() => http.verify());

  it('está activo mientras alguna petición sigue en curso', async () => {
    const first = firstValueFrom(client.get('/api/uno'));
    const second = firstValueFrom(client.get('/api/dos'));
    expect(activity.isActive()).toBe(true);

    http.expectOne('/api/uno').flush({});
    await first;
    expect(activity.isActive()).toBe(true);

    http.expectOne('/api/dos').flush(null, { status: 500, statusText: 'Error' });
    await expect(second).rejects.toBeTruthy();
    expect(activity.isActive()).toBe(false);
  });
});
