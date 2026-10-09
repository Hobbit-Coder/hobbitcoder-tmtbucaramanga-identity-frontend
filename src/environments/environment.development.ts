/**
 * Desarrollo. Igual que en producción, las llamadas a la API son relativas (`/api/...`): el servidor
 * de desarrollo (`http://localhost:4300`) las reenvía a `https://localhost:7101` (`proxy.conf.json`).
 */
export const environment = {
  production: false,
  identityApiUrl: '',
  /** Frontend de Sheepfold: los accesos del menú (Calendario, Configuración, Registros) llevan allí. */
  sheepfoldUrl: 'http://localhost:4200',
  /** API de Sheepfold: responsabilidades en grupos que se muestran al editar una cuenta. */
  sheepfoldApiUrl: 'https://localhost:7291',
  audiences: {
    identity: 'HobbitCoder.TMTBucaramanga.Identity',
    sheepfold: 'HobbitCoder.TMTBucaramanga.Sheepfold',
  },
};
