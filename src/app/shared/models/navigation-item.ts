/** Opción del menú lateral. Sin `roles` la ve cualquier usuario autenticado. */
export interface NavigationItem {
  label: string;
  /** Nombre del ícono de Material Symbols. */
  icon: string;
  route: string;
  roles?: readonly string[];
}
