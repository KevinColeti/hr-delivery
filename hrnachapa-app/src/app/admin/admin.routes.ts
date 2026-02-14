import { Routes } from '@angular/router';
import { adminAuthGuard } from './guards/admin-auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout';
import { AdminForbiddenComponent } from './pages/forbidden/admin-forbidden';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { AdminLoginComponent } from './pages/login/admin-login';
import { AdminPlaceholderComponent } from './pages/placeholder/admin-placeholder';

export const adminRoutes: Routes = [
  {
    path: 'login',
    component: AdminLoginComponent,
  },
  {
    path: 'forbidden',
    component: AdminForbiddenComponent,
  },
  {
    path: '',
    canActivate: [adminAuthGuard],
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [adminAuthGuard],
        data: { roles: ['admin', 'kitchen'] },
      },
      {
        path: 'pedidos',
        component: AdminPlaceholderComponent,
        canActivate: [adminAuthGuard],
        data: { roles: ['admin'], title: 'Pedidos' },
      },
      {
        path: 'cozinha',
        component: AdminPlaceholderComponent,
        canActivate: [adminAuthGuard],
        data: { roles: ['admin', 'kitchen'], title: 'Cozinha' },
      },
      {
        path: 'cardapio',
        component: AdminPlaceholderComponent,
        canActivate: [adminAuthGuard],
        data: { roles: ['admin'], title: 'Cardapio' },
      },
      {
        path: 'estoque',
        component: AdminPlaceholderComponent,
        canActivate: [adminAuthGuard],
        data: { roles: ['admin'], title: 'Estoque' },
      },
      {
        path: 'promocoes',
        component: AdminPlaceholderComponent,
        canActivate: [adminAuthGuard],
        data: { roles: ['admin'], title: 'Promocoes' },
      },
      {
        path: 'clientes',
        component: AdminPlaceholderComponent,
        canActivate: [adminAuthGuard],
        data: { roles: ['admin'], title: 'Clientes' },
      },
      {
        path: 'configuracoes',
        component: AdminPlaceholderComponent,
        canActivate: [adminAuthGuard],
        data: { roles: ['admin'], title: 'Configuracoes' },
      },
    ],
  },
];
