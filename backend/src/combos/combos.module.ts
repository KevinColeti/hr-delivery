import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComboRule } from '../entities/combo-rule.entity';
import { Combo } from '../entities/combo.entity';
import { CombosController } from './combos.controller';
import { CombosService } from './combos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Combo, ComboRule])],
  controllers: [CombosController],
  providers: [CombosService],
  exports: [CombosService],
})
/**
 * Modulo de combos.
 */
export class CombosModule {}
