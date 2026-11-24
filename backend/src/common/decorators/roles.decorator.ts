import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
/** Restricts route access to users holding one of the specified roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
