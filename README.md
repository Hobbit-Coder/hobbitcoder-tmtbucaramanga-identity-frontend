# HobbitcoderTmtbucaramangaIdentity

Frontend de **HobbitCoder.TMTBucaramanga.Identity** (Angular 22): ingreso, primer ingreso (activación de cuentas
creadas por la administración), recuperación de acceso, Mi perfil y gestión de usuarios. Es también el lugar al que
las aplicaciones de la plataforma (como Sheepfold) envían al usuario para iniciar sesión: les devuelve un código de
autorización (OAuth 2.0 con PKCE) en vez de pedirles credenciales. No hay registro público: las cuentas las crea un
administrador o el director y su titular las activa con un código de seguridad.

## Ambientes

|                 | Desarrollo                                                | Producción                               |
| --------------- | --------------------------------------------------------- | ---------------------------------------- |
| Frontend        | `http://localhost:4300`                                   | `https://identity.tmtbucaramanga.com`    |
| API de Identity | `/api/...` → `https://localhost:7101` (`proxy.conf.json`) | `/api/...` en el mismo dominio (Traefik) |

Las llamadas a la API siempre son relativas (`/api/...`): en producción el frontend y la API comparten dominio, y en
desarrollo el servidor de Angular las reenvía a la API. La única llamada a otro dominio es la API de Sheepfold
(responsabilidades), que admite este origen por CORS (`CorsSettings` de Sheepfold).

## Desarrollo local

1. Confía en el certificado de desarrollo: `dotnet dev-certs https --trust`.
2. Arranca Identity con su perfil `https` (`https://localhost:7101`); su README explica la configuración.
3. `pnpm install` y `pnpm start` (`ng serve`), y abre `http://localhost:4300`.

## Rutas

| Ruta                 | Acceso                   | Descripción                                                                                                   |
| -------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `/`                  | Con sesión               | Mi perfil (M17): datos personales, tema (Sistema/Claro/Oscuro) y cambio de contraseña.                        |
| `/users`             | Administrador, director  | Usuarios (M16): lista con filtros, crear/editar, solicitar reinicio de contraseña, retirar. Responsabilidades leídas de Sheepfold. |
| `/auth/sign-in`      | Sin sesión               | Ingreso (M15) con teléfono, usuario o correo; al entrar vuelve a `returnUrl`.                                  |
| `/auth/first-access` | Sin sesión               | Primer ingreso: código de seguridad → contraseña → perfil; al terminar la cuenta queda activa.                |
| `/auth/recover`      | Sin sesión               | Recuperar acceso: código de seguridad → contraseña nueva (cierra las sesiones abiertas).                      |
| `/auth/authorize`    | Con sesión               | Entrada de las aplicaciones cliente (`client_id`, `redirect_uri`, `code_challenge`, `state`).                 |

El menú lateral enlaza también con Sheepfold (Calendario para los roles ministeriales; Configuración y Registros
retirados para el administrador y el director).

## Autenticación y cuenta

| Pieza                                                                        | Responsabilidad                                                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `SignInPage`, `FirstAccessPage`, `RecoverPage` (`features/auth/pages/`)      | Formularios (Signal Forms) de ingreso, activación y recuperación.                       |
| `IdentityVerification` (`features/auth/components/identity-verification/`)   | Solicita y verifica el código de seguridad (solo por WhatsApp: el proveedor no envía SMS).        |
| `password-rules.ts`, `profile-form.ts` (`features/auth/models/`)             | Política de contraseña y reglas del perfil compartidas por activación, perfil y usuarios. |
| `AuthorizePage` (`features/auth/pages/authorize-page/`)                      | Pide el código para la aplicación cliente y devuelve el navegador a ella.               |
| `AuthService` (`features/auth/services/auth-service.ts`)                     | Login, verificación, activación, recuperación, logout, perfil y autorización de clientes. |
| `UserService` (`features/users/services/user-service.ts`)                    | Usuarios en la API de Identity y responsabilidades en la API de Sheepfold.              |
| `SessionService` (`core/services/session-service.ts`)                        | Estado de la sesión: refresh token, token de acceso y cierre en todas las pestañas.     |
| `AccessTokenService` (`core/services/access-token-service.ts`)               | Entrega el token de cada audiencia y lo renueva con `refresh`, de una renovación a la vez. |
| `jwtInterceptor` / `refreshTokenInterceptor` (`core/interceptors/`)          | Agregan `Authorization: Bearer` y, ante un 401, renuevan el token y reintentan una vez. |
| `authGuard` / `noAuthGuard` / `requireRoles` (`core/guards/`)                | Protegen las rutas; con sesión, las páginas de acceso siguen directo a `returnUrl`.     |
| `ExternalNavigationService` (`core/services/external-navigation-service.ts`) | Navega a otra aplicación (la URI de retorno del cliente).                               |

- **Inicio de sesión de las aplicaciones.** Una aplicación cliente lleva al usuario a `/auth/authorize`. Sin sesión,
  `authGuard` lo envía a `/auth/sign-in` recordando la solicitud en `returnUrl`; con sesión, `AuthorizePage` llama a
  `POST /api/auth/authorize` y redirige a la URI que devuelve Identity. Identity valida el cliente y su URI de
  retorno: si no son válidos, la página muestra el error y nunca redirige.
- **Una sesión para todas.** Las aplicaciones que entran así comparten la sesión de Identity: cerrar sesión aquí o en
  cualquiera de ellas la cierra en todas.
- **Tokens.** El token de acceso solo vive en memoria y se renueva 30 segundos antes de vencer; el refresh token se
  guarda en `localStorage` y las renovaciones van en serie entre pestañas. Para leer las responsabilidades en
  Sheepfold se pide con `refresh` un token de audiencia Sheepfold (`core/services/audience-service.ts`).
- **Contraseñas.** Solo las escribe su titular (primer ingreso, recuperación, Mi perfil). La administración solo
  solicita el reinicio; nunca ve ni define contraseñas.

## Producción (Docker + Dokploy)

El `Dockerfile` construye la aplicación y la sirve con nginx sin privilegios en el **puerto 8080**
(`nginx/default.conf`). En Dokploy:

- Tipo de build `Dockerfile`, ruta `Dockerfile`.
- Dominio `identity.tmtbucaramanga.com`, ruta `/`, puerto del contenedor `8080`, HTTPS con Let's Encrypt. La API de
  Identity es otra aplicación con el mismo dominio y rutas `/api` y `/.well-known`.

nginx sirve `index.html` para cualquier ruta de la SPA (sin caché, para recibir cada despliegue) y los archivos con
hash con caché de un año. Agrega las cabeceras de `nginx/security-headers.conf`, con una **Content Security Policy**
que solo permite conectarse al propio origen y a `https://sheepfold.tmtbucaramanga.com` (responsabilidades del
editor de usuarios). El build de producción no genera scripts inline (`inlineCritical: false` en `angular.json`).
Si Sheepfold cambia de dominio, actualiza `connect-src` además de `src/environments/environment.ts`.

## Pruebas y calidad

```bash
pnpm ng test --watch=false   # Vitest
pnpm ng lint
pnpm ng build                # producción
```

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
