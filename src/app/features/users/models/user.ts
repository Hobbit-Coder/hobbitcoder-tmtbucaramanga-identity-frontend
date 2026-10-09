import { Gender, UserRole } from '@core/index';

/** Filtros y página de `GET /api/users`. */
export interface GetUsersRequest {
  search?: string;
  isActive?: boolean;
  role?: UserRole;
  pageNumber: number;
  pageSize: number;
}

/**
 * Cuerpo de `POST /api/users` y `PUT /api/users/{id}` (§4.5). No lleva contraseña: el titular la crea al
 * activar su cuenta y la administración solo puede solicitar el reinicio.
 */
export interface UserData {
  firstName: string;
  lastName: string;
  gender: Gender | null;
  phoneNumber: string;
  email: string | null;
  userName: string;
  instagram: string | null;
  birthDate: string | null;
  role: UserRole;
  isActive: boolean;
  /** Permiso adicional para registrar asistentes nuevos; no amplía el alcance de edición (§3.2). */
  canRegisterAttendees: boolean;
}

export type GroupResponsibility = 'Coordinator' | 'Leader' | 'Apprentice';

export const RESPONSIBILITY_LABELS: Record<GroupResponsibility, string> = {
  Coordinator: 'Coordinador',
  Leader: 'Líder',
  Apprentice: 'Aprendiz',
};

/** Responsabilidad en un grupo, leída de Sheepfold (`GET /api/users/{id}/responsibilities`). */
export interface UserResponsibility {
  groupId: string;
  name: string;
  year: number;
  generationName: string;
  responsibility: GroupResponsibility;
  isActive: boolean;
}
