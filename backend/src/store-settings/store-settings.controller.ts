import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { StoreSettingsService } from './store-settings.service';

@Controller('store-settings')
/**
 * Endpoints de configuracoes operacionais da loja.
 */
export class StoreSettingsController {
  constructor(private readonly storeSettingsService: StoreSettingsService) {}

  /**
   * Retorna configuracao administrativa completa.
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findForAdmin() {
    return this.storeSettingsService.findForAdmin();
  }

  /**
   * Retorna configuracao publica para consumo no site.
   */
  @Get('public')
  @Public()
  findForPublic() {
    return this.storeSettingsService.findForPublic();
  }

  /**
   * Atualiza configuracoes de loja.
   */
  @Patch()
  @Roles(UserRole.ADMIN)
  update(@Body() dto: UpdateStoreSettingsDto) {
    return this.storeSettingsService.update(dto);
  }
}
