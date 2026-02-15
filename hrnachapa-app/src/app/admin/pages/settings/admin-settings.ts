import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminStoreSettings,
  AdminStoreSettingsService,
  UpdateAdminStoreSettingsPayload,
} from '../../services/admin-store-settings.service';

interface StoreSettingsFormModel {
  storeName: string;
  storeDescription: string;
  contactPhone: string;
  contactWhatsApp: string;
  deliveryFeeDefault: number;
  minimumOrderAmount: number;
  serviceAreaDescription: string;
  operatingHoursDescription: string;
  isStoreOpen: boolean;
}

@Component({
  selector: 'app-admin-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.css',
})
/**
 * Modulo de configuracoes operacionais da loja.
 *
 * Responsabilidades:
 * - carregar configuracao consolidada da loja;
 * - permitir edicao de dados institucionais e operacionais;
 * - persistir alteracoes no backend administrativo.
 */
export class AdminSettingsComponent implements OnInit {
  settings: AdminStoreSettings | null = null;
  form: StoreSettingsFormModel = this.createEmptyForm();

  isLoadingSettings = false;
  isSavingSettings = false;
  errorMessage = '';
  successMessage = '';

  /**
   * Injeta servico de configuracoes e detector para sincronizar UI.
   */
  constructor(
    private readonly adminStoreSettingsService: AdminStoreSettingsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  /**
   * Carrega configuracoes da loja na inicializacao da tela.
   */
  ngOnInit() {
    this.loadSettings();
  }

  /**
   * Recarrega configuracao atual do backend.
   */
  loadSettings() {
    this.isLoadingSettings = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminStoreSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.isLoadingSettings = false;
        this.settings = settings;
        this.form = this.mapSettingsToForm(settings);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingSettings = false;
        this.errorMessage =
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Nao foi possivel carregar configuracoes da loja.';
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Salva configuracoes editadas pelo operador administrativo.
   */
  saveSettings() {
    this.isSavingSettings = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpdateAdminStoreSettingsPayload = {
      storeName: this.form.storeName,
      storeDescription: this.form.storeDescription,
      contactPhone: this.form.contactPhone,
      contactWhatsApp: this.form.contactWhatsApp,
      deliveryFeeDefault: this.form.deliveryFeeDefault,
      minimumOrderAmount: this.form.minimumOrderAmount,
      serviceAreaDescription: this.form.serviceAreaDescription,
      operatingHoursDescription: this.form.operatingHoursDescription,
      isStoreOpen: this.form.isStoreOpen,
    };

    this.adminStoreSettingsService.updateSettings(payload).subscribe({
      next: (settings) => {
        this.isSavingSettings = false;
        this.settings = settings;
        this.form = this.mapSettingsToForm(settings);
        this.successMessage = 'Configuracoes salvas com sucesso.';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingSettings = false;
        this.errorMessage =
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Falha ao salvar configuracoes da loja.';
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Restaura formulario para ultimo estado salvo em backend.
   */
  resetFormToLastSaved() {
    if (!this.settings) {
      this.form = this.createEmptyForm();
      return;
    }

    this.form = this.mapSettingsToForm(this.settings);
  }

  /**
   * Converte numeric/string em numero seguro para bind com inputs number.
   */
  private toNumber(value: string | number | null | undefined) {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  /**
   * Mapeia resposta da API para modelo editavel de formulario.
   */
  private mapSettingsToForm(settings: AdminStoreSettings): StoreSettingsFormModel {
    return {
      storeName: settings.storeName ?? '',
      storeDescription: settings.storeDescription ?? '',
      contactPhone: settings.contactPhone ?? '',
      contactWhatsApp: settings.contactWhatsApp ?? '',
      deliveryFeeDefault: this.toNumber(settings.deliveryFeeDefault),
      minimumOrderAmount: this.toNumber(settings.minimumOrderAmount),
      serviceAreaDescription: settings.serviceAreaDescription ?? '',
      operatingHoursDescription: settings.operatingHoursDescription ?? '',
      isStoreOpen: settings.isStoreOpen,
    };
  }

  /**
   * Cria estado inicial do formulario antes do primeiro carregamento.
   */
  private createEmptyForm(): StoreSettingsFormModel {
    return {
      storeName: '',
      storeDescription: '',
      contactPhone: '',
      contactWhatsApp: '',
      deliveryFeeDefault: 0,
      minimumOrderAmount: 0,
      serviceAreaDescription: '',
      operatingHoursDescription: '',
      isStoreOpen: true,
    };
  }
}
