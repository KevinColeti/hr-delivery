import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  isMenuOpen = false;
  storeName = 'HR Na Chapa';
  logoUrl = '/logo.jpg';

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
