import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export const ROLES_KEY = 'roles';
/**
 * Define roles permitidas para uma rota.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
