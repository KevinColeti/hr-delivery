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
  storeName = 'HR Na Chapa';
  logoUrl = '/logo.jpg';

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
