import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from './auth/public.decorator';
import { Roles } from './auth/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller()
/**
 * Endpoints utilitarios da aplicacao.
 */
export class AppController {
  /**
   * Health-check publico.
   */
  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  /**
   * Endpoint simples para validar permissao de admin.
   */
  @Get('admin/ping')
  @Roles(UserRole.ADMIN)
  adminPing(@Req() req: Request) {
    const request = req as Request & { user?: unknown };
    return {
      status: 'ok',
      message: 'Rota protegida admin',
      user: request.user,
    };
  }
}
