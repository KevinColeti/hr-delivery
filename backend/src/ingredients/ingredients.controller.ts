import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { IngredientsService } from './ingredients.service';

@Controller('ingredients')
/**
 * Endpoints de insumos.
 */
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  /**
   * Lista insumos.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findAll() {
    return this.ingredientsService.findAll();
  }

  /**
   * Busca insumo por id.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ingredientsService.findOne(id);
  }

  /**
   * Cria insumo (admin).
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateIngredientDto) {
    return this.ingredientsService.create(dto);
  }

  /**
   * Atualiza insumo (admin).
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIngredientDto) {
    return this.ingredientsService.update(id, dto);
  }

  /**
   * Remove insumo (admin).
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ingredientsService.remove(id);
  }
}
