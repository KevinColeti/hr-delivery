import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicStoreSettingsService } from '../../services/public-store-settings.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent implements OnInit {
  private readonly fallbackStoreName = 'HR Na Chapa';
  private readonly fallbackAddress = 'Atendimento local em regioes proximas.';
  private readonly fallbackPhone = '(11) 98765-4321';
  private readonly fallbackOperatingHours = 'Seg a Dom, 18h as 23h30';
  private readonly fallbackWhatsappUrl = 'https://wa.me/5511987654321';

  email = 'contato@hrnachapa.com.br';
  instagramUrl = 'https://instagram.com/hrnachapa';
  currentYear = new Date().getFullYear();

  /**
   * Injeta configuracoes publicas para refletir contatos reais da loja.
   */
  constructor(private readonly publicStoreSettingsService: PublicStoreSettingsService) {}

  /**
   * Garante carga das configuracoes antes de renderizar informacoes de contato.
   */
  ngOnInit() {
    this.publicStoreSettingsService.ensureLoaded();
  }

  /**
   * Nome da loja exibido no rodape.
   */
  get storeName() {
    return this.publicStoreSettingsService.settings().storeName || this.fallbackStoreName;
  }

  /**
   * Descricao institucional da loja no rodape.
   */
  get storeDescription() {
    return (
      this.publicStoreSettingsService.settings().storeDescription ||
      'Hamburgueria artesanal com preparo na chapa, ingredientes selecionados e entrega rapida.'
    );
  }

  /**
   * Texto de area atendida mostrado como informacao de contato local.
   */
  get address() {
    return this.publicStoreSettingsService.settings().serviceAreaDescription || this.fallbackAddress;
  }

  /**
   * Telefone principal de contato.
   */
  get phone() {
    return this.publicStoreSettingsService.settings().contactPhone || this.fallbackPhone;
  }

  /**
   * Horario operacional da loja exibido no bloco de atendimento.
   */
  get operatingHoursDescription() {
    return (
      this.publicStoreSettingsService.settings().operatingHoursDescription ||
      this.fallbackOperatingHours
    );
  }

  /**
   * Link final de WhatsApp para CTA do rodape.
   */
  get whatsappUrl() {
    const digitsOnly = (this.publicStoreSettingsService.settings().contactWhatsApp || '')
      .replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return this.fallbackWhatsappUrl;
    }

    return `https://wa.me/${digitsOnly}`;
  }
}
