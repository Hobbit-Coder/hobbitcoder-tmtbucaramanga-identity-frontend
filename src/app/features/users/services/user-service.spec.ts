import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { UserData } from '../models';
import { UserService } from './user-service';

const USER_ID = '01a0fd28-eb05-7fba-8260-b2345d93bcec';

describe('UserService', () => {
  let users: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    users = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta una página con los filtros indicados', async () => {
    const page = firstValueFrom(
      users.getAll({ search: 'ana', isActive: false, role: 'Admin', pageNumber: 2, pageSize: 20 }),
    );

    http
      .expectOne('/api/users?pageNumber=2&pageSize=20&search=ana&isActive=false&role=Admin')
      .flush({ items: [] });
    await expect(page).resolves.toEqual({ items: [] });
  });

  it('sin filtros solo envía la página', async () => {
    const page = firstValueFrom(users.getAll({ pageNumber: 1, pageSize: 20 }));

    http.expectOne('/api/users?pageNumber=1&pageSize=20').flush({ items: [] });
    await page;
  });

  it('registra sin contraseña, actualiza, solicita el reinicio y retira', async () => {
    const data: UserData = {
      firstName: 'Ana',
      lastName: 'Pérez',
      gender: null,
      phoneNumber: '3001234567',
      email: null,
      userName: 'ana.p',
      instagram: null,
      birthDate: null,
      role: 'Leader',
      isActive: true,
      canRegisterAttendees: false,
    };

    const created = firstValueFrom(users.create(data));
    const create = http.expectOne('/api/users');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).not.toHaveProperty('password');
    create.flush(USER_ID);
    await expect(created).resolves.toBe(USER_ID);

    const updated = firstValueFrom(users.update(USER_ID, data), { defaultValue: undefined });
    const update = http.expectOne(`/api/users/${USER_ID}`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({ ...data, id: USER_ID });
    update.flush(null);
    await updated;

    const reset = firstValueFrom(users.requestPasswordReset(USER_ID), { defaultValue: undefined });
    const resetRequest = http.expectOne(`/api/users/${USER_ID}/password-reset`);
    expect(resetRequest.request.method).toBe('POST');
    resetRequest.flush(null);
    await reset;

    const retired = firstValueFrom(users.retire(USER_ID), { defaultValue: undefined });
    const remove = http.expectOne(`/api/users/${USER_ID}`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
    await retired;
  });

  it('lee las responsabilidades en grupos desde la API de Sheepfold', async () => {
    const responsibilities = firstValueFrom(users.getResponsibilities(USER_ID));

    http
      .expectOne(`${environment.sheepfoldApiUrl}/api/users/${USER_ID}/responsibilities`)
      .flush([]);
    await expect(responsibilities).resolves.toEqual([]);
  });
});
