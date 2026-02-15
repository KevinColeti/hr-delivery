import { Routes } from '@angular/router';
import { adminRoutes } from './admin/admin.routes';
import { HomeComponent } from './components/home/home';

export const routes: Routes = [
  {
    path: 'admin',
    children: adminRoutes,
  },
  {
    path: '',
    component: HomeComponent,
    data: { view: 'landing' },
  },
  {
    path: 'cardapio',
    component: HomeComponent,
    data: { view: 'catalog' },
  },
  {
    path: 'produto/:id',
    component: HomeComponent,
    data: { view: 'catalog' },
  },
  {
    path: 'carrinho',
    component: HomeComponent,
    data: { view: 'cart' },
  },
  {
    path: 'checkout',
    component: HomeComponent,
    data: { view: 'checkout' },
  },
  {
    path: 'acompanhar',
    component: HomeComponent,
    data: { view: 'tracking' },
  },
  {
    path: 'pedido/:id',
    component: HomeComponent,
    data: { view: 'order-status' },
  },
];
