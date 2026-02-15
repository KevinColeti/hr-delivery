import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface AdminStoreSettings {
  id: number;
  storeName: string;
  storeDescription: string | null;
  contactPhone: string | null;
  contactWhatsApp: string | null;
  deliveryFeeDefault: string;
  minimumOrderAmount: string;
  serviceAreaDescription: string | null;
  operatingHoursDescription: string | null;
  isStoreOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAdminStoreSettingsPayload {
  storeName?: string;
  storeDescription?: string;
  contactPhone?: string;
  contactWhatsApp?: string;
  deliveryFeeDefault?: number;
  minimumOrderAmount?: number;
  serviceAreaDescription?: string;
  operatingHoursDescription?: string;
  isStoreOpen?: boolean;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Adaptador HTTP de configuracoes de loja para o admin.
 */
export class AdminStoreSettingsService {
  private readonly baseUrl = 'http://localhost:3000/store-settings';

  /**
   * Injeta cliente HTTP para chamadas de configuracao.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Busca configuracoes completas da loja.
   */
  getSettings() {
    return this.http.get<AdminStoreSettings>(this.baseUrl);
  }

  /**
   * Atualiza configuracoes da loja.
   */
  updateSettings(payload: UpdateAdminStoreSettingsPayload) {
    return this.http.patch<AdminStoreSettings>(this.baseUrl, payload);
  }
}
