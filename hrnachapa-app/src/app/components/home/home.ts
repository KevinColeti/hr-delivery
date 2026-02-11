import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { CategorySectionComponent } from '../category-section/category-section';
import { CommonModule } from '@angular/common';
import { products, categories } from '../../data/products';
import { Product } from '../product-card/product-card';

@Component({
  selector: 'app-home',
  imports: [CommonModule, HeaderComponent, FooterComponent, CategorySectionComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  categories = categories;

  getProductsByCategory(categoryId: string): Product[] {
    return products.filter(product => product.category === categoryId);
  }
}
