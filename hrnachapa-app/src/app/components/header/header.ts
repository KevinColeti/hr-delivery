import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PublicStoreSettingsService } from '../../services/public-store-settings.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit {
  isMenuOpen = false;
  private readonly fallbackStoreName = 'HR Na Chapa';
  logoUrl = '/logo.jpg';

  /**
   * Injeta estado global de configuracoes publicas da loja.
   */
  constructor(private readonly publicStoreSettingsService: PublicStoreSettingsService) {}

  /**
   * Garante carga de configuracoes para refletir nome real da loja no header.
   */
  ngOnInit() {
    this.publicStoreSettingsService.ensureLoaded();
  }

  /**
   * Nome da loja exibido no topo com fallback seguro.
   */
  get storeName() {
    return this.publicStoreSettingsService.settings().storeName || this.fallbackStoreName;
  }

  /**
   * Alterna visibilidade do menu mobile.
   */
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Fecha menu mobile apos navegacao.
   */
  closeMenu() {
    this.isMenuOpen = false;
  }
}
