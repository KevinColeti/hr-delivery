import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-footer',
  imports: [],
  templateUrl: './admin-footer.html',
  styleUrl: './admin-footer.css',
})
/**
 * Footer simples do admin com ano corrente dinamico.
 */
export class AdminFooterComponent {
  currentYear = new Date().getFullYear();
}
