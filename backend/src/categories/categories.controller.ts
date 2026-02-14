import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
/**
 * Endpoints de categorias.
 */
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Lista categorias.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findAll() {
    return this.categoriesService.findAll();
  }

  /**
   * Lista categorias publicas para vitrine do site.
   */
  @Get('public/catalog')
  @Public()
  findPublicCatalog() {
    return this.categoriesService.findPublicCatalog();
  }

  /**
   * Busca categoria por id.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.KITCHEN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  /**
   * Cria categoria (admin).
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  /**
   * Atualiza categoria (admin).
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  /**
   * Remove categoria (admin).
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
