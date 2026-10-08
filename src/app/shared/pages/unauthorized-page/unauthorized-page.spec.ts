import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UnauthorizedPage } from './unauthorized-page';

describe('UnauthorizedPage', () => {
  let fixture: ComponentFixture<UnauthorizedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnauthorizedPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(UnauthorizedPage);
    await fixture.whenStable();
  });

  it('explica lo que pasó y ofrece volver al inicio', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Acceso denegado');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/');
  });
});
