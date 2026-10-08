import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Role, UserRolesService } from '@core/index';
import { AccessRoleDirective } from './access-role-directive';

@Component({
  imports: [AccessRoleDirective],
  template: `
    <button *appAccessRole="[role.Admin]; else readOnly">Crear usuario</button>
    <ng-template #readOnly><p>Solo lectura</p></ng-template>
  `,
})
class HostComponent {
  protected readonly role = Role;
}

describe('AccessRoleDirective', () => {
  const roles = signal<readonly string[] | null>(null);
  const ensureLoaded = vi.fn();

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    roles.set(null);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserRolesService,
          useValue: {
            ensureLoaded,
            hasAnyRole: (allowed: readonly string[]) =>
              allowed.some((role) => roles()?.includes(role)),
          },
        },
      ],
    });
  });

  it('con el rol muestra el contenido', async () => {
    roles.set([Role.Admin]);

    const element = await render();

    expect(element.querySelector('button')).not.toBeNull();
    expect(element.textContent).not.toContain('Solo lectura');
  });

  it('sin el rol muestra la alternativa', async () => {
    roles.set(['Otro']);

    const element = await render();

    expect(element.querySelector('button')).toBeNull();
    expect(element.textContent).toContain('Solo lectura');
  });

  it('mientras no se conocen los roles los pide y no muestra el contenido', async () => {
    const element = await render();

    expect(ensureLoaded).toHaveBeenCalled();
    expect(element.querySelector('button')).toBeNull();
  });
});
