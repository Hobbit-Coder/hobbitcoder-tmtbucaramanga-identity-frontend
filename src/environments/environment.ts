/**
 * Producción. El frontend y la API de Identity comparten `https://identity.tmtbucaramanga.com`:
 * Traefik envía `/api/...` y `/.well-known/...` a la API, así que sus llamadas son relativas y del
 * mismo origen.
 */
export const environment = {
  production: true,
  identityApiUrl: '',
  /** Frontend de Sheepfold: los accesos del menú (Calendario, Configuración, Registros) llevan allí. */
  sheepfoldUrl: 'https://sheepfold.tmtbucaramanga.com',
  /** API de Sheepfold: responsabilidades en grupos que se muestran al editar una cuenta. */
  sheepfoldApiUrl: 'https://sheepfold.tmtbucaramanga.com',
  audiences: {
    identity: 'HobbitCoder.TMTBucaramanga.Identity',
    sheepfold: 'HobbitCoder.TMTBucaramanga.Sheepfold',
  },
};
