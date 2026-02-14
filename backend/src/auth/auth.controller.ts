import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('auth')
/**
 * Endpoints de autenticacao.
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Realiza login e retorna JWT.
   */
  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  /**
   * Retorna dados do usuario autenticado.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  me(@Req() req: Request) {
    const request = req as Request & { user?: unknown };
    return request.user;
  }
}
