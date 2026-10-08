/**
 * Desarrollo. Igual que en producción, las llamadas a la API son relativas (`/api/...`): el servidor
 * de desarrollo (`http://localhost:4300`) las reenvía a `https://localhost:7101` (`proxy.conf.json`).
 */
export const environment = {
  production: false,
  identityApiUrl: '',
  audiences: {
    identity: 'HobbitCoder.TMTBucaramanga.Identity',
  },
};
