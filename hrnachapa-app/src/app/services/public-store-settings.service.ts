import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

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

@Injectable({
  providedIn: 'root',
})
/**
 * Estado global das configuracoes publicas da loja.
 *
 * Responsabilidades:
 * - carregar configuracoes publicas uma unica vez por sessao;
 * - expor fallback resiliente para nao bloquear navegacao se API falhar;
 * - compartilhar configuracoes entre header, footer e fluxo de checkout.
 */
export class PublicStoreSettingsService {
  private readonly settingsUrl = 'http://localhost:3000/store-settings/public';
  private readonly fallbackSettings: PublicStoreSettingsResponse = {
    storeName: 'HR Na Chapa',
    storeDescription: 'Hamburgueria artesanal com preparo na chapa.',
    contactPhone: '(11) 98765-4321',
    contactWhatsApp: '5511987654321',
    deliveryFeeDefault: '6.00',
    minimumOrderAmount: '0.00',
    serviceAreaDescription: 'Atendimento local em regioes proximas.',
    operatingHoursDescription: 'Seg a Dom, 18h as 23h30',
    isStoreOpen: true,
  };
  private hasLoadedOnce = false;
  private isLoadingRequest = false;
  private readonly settingsSignal = signal<PublicStoreSettingsResponse>(this.fallbackSettings);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal('');

  readonly settings = this.settingsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly loadError = this.errorSignal.asReadonly();

  /**
   * Injeta cliente HTTP para consulta de configuracoes publicas.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Garante carga unica das configuracoes publicas da loja.
   *
   * Motivo:
   * varios componentes publicos dependem da mesma configuracao; centralizar
   * evita chamadas duplicadas e estado divergente entre blocos da pagina.
   */
  ensureLoaded() {
    if (this.hasLoadedOnce || this.isLoadingRequest) {
      return;
    }

    this.isLoadingRequest = true;
    this.loadingSignal.set(true);
    this.errorSignal.set('');

    this.http.get<PublicStoreSettingsResponse>(this.settingsUrl).subscribe({
      next: (settings) => {
        this.isLoadingRequest = false;
        this.hasLoadedOnce = true;
        this.loadingSignal.set(false);
        this.settingsSignal.set({
          ...this.fallbackSettings,
          ...settings,
        });
      },
      error: () => {
        this.isLoadingRequest = false;
        this.loadingSignal.set(false);
        this.errorSignal.set('Nao foi possivel carregar configuracoes da loja.');
      },
    });
  }
}
