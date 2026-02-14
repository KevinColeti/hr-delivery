import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CombosService } from './combos.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { CreateComboRuleDto } from './dto/create-combo-rule.dto';
import { UpdateComboDto } from './dto/update-combo.dto';
import { UpdateComboRuleDto } from './dto/update-combo-rule.dto';

@Controller('combos')
/**
 * Endpoints de combos automaticos.
 */
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  /**
   * Lista combos.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findAll() {
    return this.combosService.findAll();
  }

  /**
   * Busca combo por id.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.combosService.findOne(id);
  }

  /**
   * Cria combo.
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateComboDto) {
    return this.combosService.create(dto);
  }

  /**
   * Atualiza combo.
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateComboDto) {
    return this.combosService.update(id, dto);
  }

  /**
   * Remove combo.
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.combosService.remove(id);
  }

  /**
   * Lista regras de combo.
   */
  @Get(':comboId/rules')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  listRules(@Param('comboId', ParseIntPipe) comboId: number) {
    return this.combosService.listRules(comboId);
  }

  /**
   * Busca regra de combo por id.
   */
  @Get(':comboId/rules/:ruleId')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findRule(
    @Param('comboId', ParseIntPipe) comboId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
  ) {
    return this.combosService.findRule(comboId, ruleId);
  }

  /**
   * Cria regra de combo.
   */
  @Post(':comboId/rules')
  @Roles(UserRole.ADMIN)
  createRule(
    @Param('comboId', ParseIntPipe) comboId: number,
    @Body() dto: CreateComboRuleDto,
  ) {
    return this.combosService.createRule(comboId, dto);
  }

  /**
   * Atualiza regra de combo.
   */
  @Patch(':comboId/rules/:ruleId')
  @Roles(UserRole.ADMIN)
  updateRule(
    @Param('comboId', ParseIntPipe) comboId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @Body() dto: UpdateComboRuleDto,
  ) {
    return this.combosService.updateRule(comboId, ruleId, dto);
  }

  /**
   * Remove regra de combo.
   */
  @Delete(':comboId/rules/:ruleId')
  @Roles(UserRole.ADMIN)
  removeRule(
    @Param('comboId', ParseIntPipe) comboId: number,
    @Param('ruleId', ParseIntPipe) ruleId: number,
  ) {
    return this.combosService.removeRule(comboId, ruleId);
  }
}
