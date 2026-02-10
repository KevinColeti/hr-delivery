import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';
import { CategorySectionComponent } from './components/category-section/category-section';
import { CommonModule } from '@angular/common';
import { products, categories } from './data/products';
import { Product } from './components/product-card/product-card';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HeaderComponent, FooterComponent, CategorySectionComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  categories = categories;

  getProductsByCategory(categoryId: string): Product[] {
    return products.filter(product => product.category === categoryId);
  }
}
