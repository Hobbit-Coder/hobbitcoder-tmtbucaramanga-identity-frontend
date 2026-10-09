/**
 * Opción del menú lateral. Sin `roles` la ve cualquier usuario autenticado. `href` lleva a otra aplicación
 * (Sheepfold) en lugar de una ruta de Identity.
 */
export interface NavigationItem {
  label: string;
  /** Nombre del ícono de Material Symbols. */
  icon: string;
  route?: string;
  href?: string;
  roles?: readonly string[];
}
