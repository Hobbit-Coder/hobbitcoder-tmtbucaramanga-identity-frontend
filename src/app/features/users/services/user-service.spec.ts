import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
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

  it('crea, actualiza, asigna contraseña y elimina', async () => {
    const data = {
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Pérez',
      phoneNumber: null,
      isActive: true,
      emailConfirmed: false,
      roles: ['Admin'],
    };

    const created = firstValueFrom(users.create({ ...data, password: 'Clave#2026' }));
    const create = http.expectOne('/api/users');
    expect(create.request.method).toBe('POST');
    create.flush(USER_ID);
    await expect(created).resolves.toBe(USER_ID);

    const updated = firstValueFrom(users.update({ ...data, id: USER_ID }), {
      defaultValue: undefined,
    });
    const update = http.expectOne(`/api/users/${USER_ID}`);
    expect(update.request.method).toBe('PUT');
    update.flush(null);
    await updated;

    const password = firstValueFrom(users.setPassword({ id: USER_ID, newPassword: 'Nueva#2026' }), {
      defaultValue: undefined,
    });
    const setPassword = http.expectOne(`/api/users/${USER_ID}/password`);
    expect(setPassword.request.body).toEqual({ id: USER_ID, newPassword: 'Nueva#2026' });
    setPassword.flush(null);
    await password;

    const deleted = firstValueFrom(users.delete(USER_ID), { defaultValue: undefined });
    const remove = http.expectOne(`/api/users/${USER_ID}`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
    await deleted;
  });
});
