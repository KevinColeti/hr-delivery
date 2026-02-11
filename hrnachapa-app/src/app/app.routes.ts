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
  },
];
