import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar-component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
  });

  it('muestra las opciones recibidas, de esta aplicación y de Sheepfold', async () => {
    fixture.componentRef.setInput('items', [
      { label: 'Usuarios', icon: 'group', route: '/users' },
      { label: 'Calendario', icon: 'calendar_month', href: 'https://sheepfold.test/' },
    ]);
    await fixture.whenStable();

    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav a'));

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      expect.stringContaining('Usuarios'),
      expect.stringContaining('Calendario'),
    ]);
    expect(links[1].getAttribute('href')).toBe('https://sheepfold.test/');
  });
});
