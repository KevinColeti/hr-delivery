import { Component, Input } from '@angular/core';
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
}
