import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent {
  storeName = 'HRNachapa';
  address = 'Rua dos Hambúrgueres, 123 - Centro, São Paulo - SP';
  phone = '(11) 98765-4321';
  email = 'contato@hrnachapa.com.br';
  instagramUrl = 'https://instagram.com/hrnachapa';
  whatsappUrl = 'https://wa.me/5511987654321';
  currentYear = new Date().getFullYear();
}
