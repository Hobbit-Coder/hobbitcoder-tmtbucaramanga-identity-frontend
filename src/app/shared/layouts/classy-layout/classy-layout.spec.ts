import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserRolesService } from '@core/index';
import { AuthService } from '@features/auth/services/auth-service';
import { of } from 'rxjs';
import { CurrentUserStore } from '@shared/services/current-user-store';
import { ClassyLayout } from './classy-layout';

describe('ClassyLayout', () => {
  let fixture: ComponentFixture<ClassyLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassyLayout],
      providers: [
        provideRouter([]),
        { provide: UserRolesService, useValue: { ensureLoaded: vi.fn(), hasAnyRole: () => false } },
        {
          provide: AuthService,
          useValue: { getCurrentUser: () => of(undefined), logout: () => of(undefined) },
        },
        { provide: CurrentUserStore, useValue: { user: { value: () => undefined } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassyLayout);
    await fixture.whenStable();
  });

  it('arma el menú lateral alrededor del contenido', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-sidebar-component')).not.toBeNull();
    expect(element.querySelector('main router-outlet')).not.toBeNull();
  });
});
