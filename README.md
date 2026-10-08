# HobbitcoderTmtbucaramangaIdentity

Frontend de **HobbitCoder.TMTBucaramanga.Identity** (Angular 22): inicio de sesión, registro y cuenta del usuario. Es
también el lugar al que las aplicaciones de la plataforma (como Sheepfold) envían al usuario para iniciar sesión: les
devuelve un código de autorización (OAuth 2.0 con PKCE) en vez de pedirles credenciales.

## Ambientes

|                 | Desarrollo                                                | Producción                               |
| --------------- | --------------------------------------------------------- | ---------------------------------------- |
| Frontend        | `http://localhost:4300`                                   | `https://identity.tmtbucaramanga.com`    |
| API de Identity | `/api/...` → `https://localhost:7101` (`proxy.conf.json`) | `/api/...` en el mismo dominio (Traefik) |

Las llamadas a la API siempre son relativas (`/api/...`): en producción el frontend y la API comparten dominio, y en
desarrollo el servidor de Angular las reenvía a la API, así que no hace falta CORS.

## Desarrollo local

1. Confía en el certificado de desarrollo: `dotnet dev-certs https --trust`.
2. Arranca Identity con su perfil `https` (`https://localhost:7101`); su README explica la configuración.
3. `pnpm install` y `pnpm start` (`ng serve`), y abre `http://localhost:4300`.

## Rutas

| Ruta              | Acceso     | Descripción                                                                                   |
| ----------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `/`               | Con sesión | Mi cuenta: perfil y cierre de sesión.                                                         |
| `/auth/sign-in`   | Sin sesión | Inicio de sesión; al entrar vuelve a `returnUrl`.                                             |
| `/auth/sign-up`   | Sin sesión | Registro público (cuenta activa y sin roles); inicia sesión y vuelve a `returnUrl`.           |
| `/auth/authorize` | Con sesión | Entrada de las aplicaciones cliente (`client_id`, `redirect_uri`, `code_challenge`, `state`). |

## Autenticación

| Pieza                                                                        | Responsabilidad                                                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `SignInPage` / `SignUpPage` (`features/auth/pages/`)                         | Formularios (Signal Forms) de inicio de sesión y registro.                              |
| `AuthorizePage` (`features/auth/pages/authorize-page/`)                      | Pide el código para la aplicación cliente y devuelve el navegador a ella.               |
| `AuthService` (`features/auth/services/auth-service.ts`)                     | Login, registro, logout, perfil y autorización de clientes contra la API de Identity.   |
| `SessionService` (`core/services/session-service.ts`)                        | Estado de la sesión: refresh token, token de acceso y cierre en todas las pestañas.     |
| `AccessTokenService` (`core/services/access-token-service.ts`)               | Entrega el token de acceso y lo renueva con `refresh`, de una renovación a la vez.      |
| `jwtInterceptor` / `refreshTokenInterceptor` (`core/interceptors/`)          | Agregan `Authorization: Bearer` y, ante un 401, renuevan el token y reintentan una vez. |
| `authGuard` / `noAuthGuard` (`core/guards/`)                                 | Protegen las rutas; con sesión, las páginas de acceso siguen directo a `returnUrl`.     |
| `ExternalNavigationService` (`core/services/external-navigation-service.ts`) | Navega a otra aplicación (la URI de retorno del cliente).                               |

- **Inicio de sesión de las aplicaciones.** Una aplicación cliente lleva al usuario a `/auth/authorize`. Sin sesión,
  `authGuard` lo envía a `/auth/sign-in` (o a crear su cuenta) recordando la solicitud en `returnUrl`; con sesión,
  `AuthorizePage` llama a `POST /api/auth/authorize` y redirige a la URI que devuelve Identity. Identity valida el
  cliente y su URI de retorno: si no son válidos, la página muestra el error y nunca redirige.
- **Una sesión para todas.** Las aplicaciones que entran así comparten la sesión de Identity: cerrar sesión aquí o en
  cualquiera de ellas la cierra en todas.
- **Tokens.** Los mismos criterios que en Sheepfold: el token de acceso solo vive en memoria y se renueva 30 segundos
  antes de vencer; el refresh token se guarda en `localStorage` y las renovaciones van en serie entre pestañas.

## Producción (Docker + Dokploy)

El `Dockerfile` construye la aplicación y la sirve con nginx sin privilegios en el **puerto 8080**
(`nginx/default.conf`). En Dokploy:

- Tipo de build `Dockerfile`, ruta `Dockerfile`.
- Dominio `identity.tmtbucaramanga.com`, ruta `/`, puerto del contenedor `8080`, HTTPS con Let's Encrypt. La API de
  Identity es otra aplicación con el mismo dominio y rutas `/api` y `/.well-known`.

nginx sirve `index.html` para cualquier ruta de la SPA (sin caché, para recibir cada despliegue) y los archivos con
hash con caché de un año. Agrega las cabeceras de `nginx/security-headers.conf`, con una **Content Security Policy**
que solo permite conectarse al propio origen. El build de producción no genera scripts inline
(`inlineCritical: false` en `angular.json`).

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
