import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../entities/user.entity';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
/**
 * Servico de autenticacao.
 *
 * Responsavel por validar credenciais, emitir JWT e garantir admin inicial.
 */
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Valida email/senha e retorna usuario ativo.
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    return user;
  }

  /**
   * Efetua login e devolve token + payload de usuario.
   */
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Garante um admin inicial em ambiente novo.
   *
   * Motivo: facilitar bootstrap do projeto sem etapa manual de seed.
   */
  async ensureDefaultAdmin() {
    const currentUsers = await this.usersService.count();
    if (currentUsers > 0) {
      return;
    }

    const email = this.configService.get<string>('ADMIN_EMAIL') ?? 'admin@hrnachapa.local';
    const password = this.configService.get<string>('ADMIN_PASSWORD') ?? 'admin123';
    const name = this.configService.get<string>('ADMIN_NAME') ?? 'Administrador';

    const passwordHash = await bcrypt.hash(password, 10);

    await this.usersService.create({
      name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    });
  }
}
