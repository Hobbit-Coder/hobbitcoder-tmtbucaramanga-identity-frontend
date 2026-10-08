import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SignInUrlService } from './sign-in-url-service';

describe('SignInUrlService', () => {
  let router: Router;
  let signInUrl: SignInUrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
    signInUrl = TestBed.inject(SignInUrlService);
  });

  describe('signInUrlTree', () => {
    it('recuerda la página a la que se quería ir', () => {
      expect(router.serializeUrl(signInUrl.signInUrlTree('/mi-cuenta'))).toBe(
        '/auth/sign-in?returnUrl=%2Fmi-cuenta',
      );
    });

    it('desde el inicio no agrega returnUrl', () => {
      expect(router.serializeUrl(signInUrl.signInUrlTree('/'))).toBe('/auth/sign-in');
      expect(router.serializeUrl(signInUrl.signInUrlTree())).toBe('/auth/sign-in');
    });
  });

  describe('safeReturnUrl', () => {
    it('acepta rutas internas', () => {
      expect(signInUrl.safeReturnUrl('/mi-cuenta?status=1')).toBe('/mi-cuenta?status=1');
    });

    it('lleva al inicio con valores externos o vacíos', () => {
      for (const returnUrl of [
        'https://evil.com',
        '//evil.com',
        '/\\evil.com',
        'mi-cuenta',
        '',
        null,
        undefined,
      ]) {
        expect(signInUrl.safeReturnUrl(returnUrl)).toBe('/');
      }
    });
  });
});
