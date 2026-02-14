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
  featuredItems = products.slice(0, 3);

  mockCart = [
    { name: 'X-Burger Classico', qty: 2, total: 51.8 },
    { name: 'Batata Frita', qty: 1, total: 12.9 },
    { name: 'Coca-Cola 350ml', qty: 2, total: 11.8 },
  ];

  orderTimeline = [
    { status: 'Pedido recebido', time: '19:42', done: true },
    { status: 'Em preparo na chapa', time: '19:49', done: true },
    { status: 'Saiu para entrega', time: '20:05', done: false },
    { status: 'Entregue', time: '--:--', done: false },
  ];

  get cartSubtotal(): number {
    return this.mockCart.reduce((sum, item) => sum + item.total, 0);
  }

  getProductsByCategory(categoryId: string): Product[] {
    return products.filter(product => product.category === categoryId);
  }
}
