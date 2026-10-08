/**
 * Producción. El frontend y la API de Identity comparten `https://identity.tmtbucaramanga.com`:
 * Traefik envía `/api/...` y `/.well-known/...` a la API, así que sus llamadas son relativas y del
 * mismo origen.
 */
export const environment = {
  production: true,
  identityApiUrl: '',
  audiences: {
    identity: 'HobbitCoder.TMTBucaramanga.Identity',
  },
};
