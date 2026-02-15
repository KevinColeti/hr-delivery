import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreSettings } from '../entities/store-settings.entity';
import { StoreSettingsController } from './store-settings.controller';
import { StoreSettingsService } from './store-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoreSettings])],
  controllers: [StoreSettingsController],
  providers: [StoreSettingsService],
  exports: [StoreSettingsService],
})
/**
 * Modulo de configuracoes operacionais da loja.
 */
export class StoreSettingsModule {}
