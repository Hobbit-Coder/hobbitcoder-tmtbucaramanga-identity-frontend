import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ExternalNavigationService, ProblemDetails } from '@core/index';
import { AuthService } from '@features/auth/services/auth-service';
import { of, throwError } from 'rxjs';
import { AuthorizePage } from './authorize-page';

const QUERY = {
  client_id: 'sheepfold-web',
  redirect_uri: 'http://localhost:4200/auth/callback',
  code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
  code_challenge_method: 'S256',
  state: 'estado',
};

describe('AuthorizePage', () => {
  const authorize = vi.fn();
  const navigateTo = vi.fn();

  async function render(): Promise<ComponentFixture<AuthorizePage>> {
    await TestBed.configureTestingModule({
      imports: [AuthorizePage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { authorize } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(QUERY) } },
        },
        { provide: ExternalNavigationService, useValue: { navigateTo } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AuthorizePage);
    await fixture.whenStable();
    return fixture;
  }

  beforeEach(() => {
    authorize.mockReset();
    navigateTo.mockReset();
  });

  it('pide el código con los parámetros de OAuth y vuelve al cliente', async () => {
    authorize.mockReturnValue(of('http://localhost:4200/auth/callback?code=abc&state=estado'));

    await render();

    expect(authorize).toHaveBeenCalledWith({
      clientId: 'sheepfold-web',
      redirectUri: 'http://localhost:4200/auth/callback',
      codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
      codeChallengeMethod: 'S256',
      state: 'estado',
    });
    expect(navigateTo).toHaveBeenCalledWith(
      'http://localhost:4200/auth/callback?code=abc&state=estado',
    );
  });

  it('si Identity rechaza el cliente, muestra el error y no redirige', async () => {
    authorize.mockReturnValue(throwError(() => ({ status: 400 }) as ProblemDetails));

    const fixture = await render();

    expect(navigateTo).not.toHaveBeenCalled();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role=alert]')?.textContent,
    ).toContain('no está registrada');
  });
});
