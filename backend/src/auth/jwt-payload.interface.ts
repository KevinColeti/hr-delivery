import { UserRole } from '../entities/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}
