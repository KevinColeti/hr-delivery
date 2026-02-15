import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable?: boolean;
}

@Component({
  selector: 'app-product-card',
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
/**
 * Card de produto usado na vitrine publica.
 *
 * Emite eventos separados para:
 * - adicao direta ao carrinho;
 * - abertura de detalhe com personalizacao.
 */
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() add = new EventEmitter<Product>();
  @Output() details = new EventEmitter<Product>();

  /**
   * Dispara evento de adicao para componente pai.
   */
  onAdd() {
    this.add.emit(this.product);
  }

  /**
   * Dispara abertura do detalhe do produto.
   */
  onDetails() {
    this.details.emit(this.product);
  }
}
