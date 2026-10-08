import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CurrentUser } from '@core/index';
import { AuthService } from '@features/auth/services/auth-service';
import { of } from 'rxjs';
import { NavbarComponent } from './navbar-component';

describe('NavbarComponent', () => {
  const logout = vi.fn(() => of(undefined));
  const user: CurrentUser = {
    id: '1',
    email: 'ana@example.com',
    firstName: 'Ana',
    lastName: 'Pérez',
    phoneNumber: null,
    isActive: true,
    emailConfirmed: true,
    roles: [],
  };
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { getCurrentUser: () => of(user), logout } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    await fixture.whenStable();
  });

  it('muestra el nombre de la aplicación y el del usuario', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Identity');
    expect(text).toContain('Ana Pérez');
  });

  it('avisa cuando se pide abrir o cerrar el menú', () => {
    const toggled = vi.fn();
    fixture.componentInstance.menuToggle.subscribe(toggled);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[aria-label="Abrir o cerrar el menú"]')!
      .click();

    expect(toggled).toHaveBeenCalled();
  });
});
