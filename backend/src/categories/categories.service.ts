import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
/**
 * Regras de negocio de categorias do cardapio.
 */
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  /**
   * Garante categoria padrao de combos ao inicializar o modulo.
   *
   * Motivo:
   * combos agora sao itens do cardapio e dependem da categoria `combos`
   * existir/estar ativa para aparecer no catalogo publico.
   */
  async onModuleInit() {
    await this.ensureDefaultCombosCategory();
  }

  /**
   * Lista categorias ordenadas para exibicao.
   */
  findAll() {
    return this.categoriesRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Lista somente categorias ativas para catalogo publico.
   */
  findPublicCatalog() {
    return this.categoriesRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Busca categoria por id.
   */
  async findOne(id: number) {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Categoria nao encontrada');
    }
    return category;
  }

  /**
   * Cria categoria validando unicidade de nome/slug.
   */
  async create(dto: CreateCategoryDto) {
    await this.ensureUnique(dto.name, dto.slug);

    const category = this.categoriesRepository.create({
      name: dto.name.trim(),
      slug: dto.slug.trim().toLowerCase(),
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });

    return this.categoriesRepository.save(category);
  }

  /**
   * Atualiza categoria e revalida unicidade quando necessario.
   */
  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (dto.name || dto.slug) {
      await this.ensureUnique(dto.name ?? category.name, dto.slug ?? category.slug, id);
    }

    const merged = this.categoriesRepository.merge(category, {
      ...dto,
      name: dto.name?.trim(),
      slug: dto.slug?.trim().toLowerCase(),
    });

    return this.categoriesRepository.save(merged);
  }

  /**
   * Remove categoria por id.
   */
  async remove(id: number) {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
    return { success: true };
  }

  /**
   * Evita duplicidade de nome e slug.
   */
  private async ensureUnique(name: string, slug: string, exceptId?: number) {
    const nameQuery = this.categoriesRepository
      .createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', { name });

    const slugQuery = this.categoriesRepository
      .createQueryBuilder('category')
      .where('LOWER(category.slug) = LOWER(:slug)', { slug });

    if (exceptId) {
      nameQuery.andWhere('category.id != :exceptId', { exceptId });
      slugQuery.andWhere('category.id != :exceptId', { exceptId });
    }

    const [nameExists, slugExists] = await Promise.all([nameQuery.getOne(), slugQuery.getOne()]);

    if (nameExists) {
      throw new ConflictException('Ja existe uma categoria com este nome');
    }

    if (slugExists) {
      throw new ConflictException('Ja existe uma categoria com este slug');
    }
  }

  /**
   * Garante existencia e ativacao da categoria tecnica `Combos`.
   *
   * Regra:
   * - se slug `combos` existir, reaproveita;
   * - senao, tenta reaproveitar categoria com nome `Combos`;
   * - se nada existir, cria categoria nova.
   */
  private async ensureDefaultCombosCategory() {
    const bySlug = await this.categoriesRepository
      .createQueryBuilder('category')
      .where('LOWER(category.slug) = LOWER(:slug)', { slug: 'combos' })
      .getOne();

    if (bySlug) {
      const merged = this.categoriesRepository.merge(bySlug, {
        isActive: true,
      });
      await this.categoriesRepository.save(merged);
      return;
    }

    const byName = await this.categoriesRepository
      .createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', { name: 'Combos' })
      .getOne();

    if (byName) {
      const merged = this.categoriesRepository.merge(byName, {
        slug: 'combos',
        isActive: true,
      });
      await this.categoriesRepository.save(merged);
      return;
    }

    const category = this.categoriesRepository.create({
      name: 'Combos',
      slug: 'combos',
      sortOrder: 0,
      isActive: true,
    });
    await this.categoriesRepository.save(category);
  }
}
