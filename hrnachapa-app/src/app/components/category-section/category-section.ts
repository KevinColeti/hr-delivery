import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent, Product } from '../product-card/product-card';

@Component({
  selector: 'app-category-section',
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './category-section.html',
  styleUrl: './category-section.css'
})
export class CategorySectionComponent {
  @Input() title: string = '';
  @Input() products: Product[] = [];
  @Output() addProduct = new EventEmitter<Product>();
  @Output() viewProductDetails = new EventEmitter<Product>();

  /**
   * Repassa evento de adicionar para evitar acoplamento com estado global.
   */
  onAddProduct(product: Product) {
    this.addProduct.emit(product);
  }

  /**
   * Repassa evento de visualizacao de detalhe do produto.
   */
  onViewProductDetails(product: Product) {
    this.viewProductDetails.emit(product);
  }
}
