import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreSettings } from '../entities/store-settings.entity';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';

export interface PublicStoreSettingsResponse {
  storeName: string;
  storeDescription: string | null;
  contactPhone: string | null;
  contactWhatsApp: string | null;
  deliveryFeeDefault: string;
  minimumOrderAmount: string;
  serviceAreaDescription: string | null;
  operatingHoursDescription: string | null;
  isStoreOpen: boolean;
}

@Injectable()
/**
 * Regras de configuracoes operacionais da loja.
 *
 * Responsabilidades:
 * - manter configuracao unica da operacao;
 * - expor visao administrativa completa;
 * - expor visao publica sanitizada para checkout/site.
 */
export class StoreSettingsService {
  constructor(
    @InjectRepository(StoreSettings)
    private readonly storeSettingsRepository: Repository<StoreSettings>,
  ) {}

  /**
   * Retorna configuracoes completas para backoffice.
   */
  async findForAdmin() {
    return this.ensureSettings();
  }

  /**
   * Retorna configuracoes publicas da loja para o site.
   */
  async findForPublic(): Promise<PublicStoreSettingsResponse> {
    const settings = await this.ensureSettings();

    return {
      storeName: settings.storeName,
      storeDescription: settings.storeDescription,
      contactPhone: settings.contactPhone,
      contactWhatsApp: settings.contactWhatsApp,
      deliveryFeeDefault: settings.deliveryFeeDefault,
      minimumOrderAmount: settings.minimumOrderAmount,
      serviceAreaDescription: settings.serviceAreaDescription,
      operatingHoursDescription: settings.operatingHoursDescription,
      isStoreOpen: settings.isStoreOpen,
    };
  }

  /**
   * Atualiza configuracoes da loja.
   */
  async update(dto: UpdateStoreSettingsDto) {
    const settings = await this.ensureSettings();

    const merged = this.storeSettingsRepository.merge(settings, {
      storeName: dto.storeName?.trim(),
      storeDescription: this.normalizeNullableText(dto.storeDescription),
      contactPhone: this.normalizeNullableText(dto.contactPhone),
      contactWhatsApp: this.normalizeNullableText(dto.contactWhatsApp),
      deliveryFeeDefault:
        dto.deliveryFeeDefault !== undefined ? this.toMoney(dto.deliveryFeeDefault) : undefined,
      minimumOrderAmount:
        dto.minimumOrderAmount !== undefined ? this.toMoney(dto.minimumOrderAmount) : undefined,
      serviceAreaDescription: this.normalizeNullableText(dto.serviceAreaDescription),
      operatingHoursDescription: this.normalizeNullableText(dto.operatingHoursDescription),
      isStoreOpen: dto.isStoreOpen,
    });

    return this.storeSettingsRepository.save(merged);
  }

  /**
   * Garante existencia de registro unico de configuracoes.
   *
   * Motivo:
   * como o modulo e singleton por loja na fase atual, auto-provisionamos o
   * primeiro registro para evitar etapa manual de seed/configuracao inicial.
   */
  private async ensureSettings() {
    const [existing] = await this.storeSettingsRepository.find({
      order: { id: 'ASC' },
      take: 1,
    });

    if (existing) {
      return existing;
    }

    const created = this.storeSettingsRepository.create({
      storeName: 'HR Na Chapa',
      storeDescription: null,
      contactPhone: null,
      contactWhatsApp: null,
      deliveryFeeDefault: this.toMoney(0),
      minimumOrderAmount: this.toMoney(0),
      serviceAreaDescription: null,
      operatingHoursDescription: null,
      isStoreOpen: true,
    });

    return this.storeSettingsRepository.save(created);
  }

  /**
   * Normaliza string opcional para persistencia nullable.
   */
  private normalizeNullableText(value?: string) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  /**
   * Formata decimal monetario com duas casas.
   */
  private toMoney(value: number) {
    return value.toFixed(2);
  }
}
