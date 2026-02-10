import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  isMenuOpen = false;
  storeName = 'HRNachapa';
  logoUrl = 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=200&fit=crop';

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
