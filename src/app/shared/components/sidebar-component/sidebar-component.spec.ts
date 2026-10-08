import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Role, UserRolesService } from '@core/index';
import { SidebarComponent } from './sidebar-component';

describe('SidebarComponent', () => {
  const roles = signal<readonly string[] | null>(null);
  let fixture: ComponentFixture<SidebarComponent>;

  async function labels(): Promise<string[]> {
    await fixture.whenStable();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')).map(
      (link) => link.textContent?.trim() ?? '',
    );
  }

  beforeEach(async () => {
    roles.set(null);
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        {
          provide: UserRolesService,
          useValue: {
            ensureLoaded: vi.fn(),
            hasAnyRole: (allowed: readonly string[]) =>
              allowed.some((role) => roles()?.includes(role)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
  });

  it('sin el rol solo muestra las opciones abiertas', async () => {
    expect(await labels()).toEqual([expect.stringContaining('Mi cuenta')]);
  });

  it('con el rol muestra también las opciones que lo exigen', async () => {
    roles.set([Role.Admin]);

    expect(await labels()).toEqual([
      expect.stringContaining('Mi cuenta'),
      expect.stringContaining('Usuarios'),
    ]);
  });
});
