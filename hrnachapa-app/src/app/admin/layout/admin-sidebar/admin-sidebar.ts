import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css',
})
export class AdminSidebarComponent {
  menuItems = [
    { label: 'Dashboard', icon: '📊', route: '/admin/dashboard' },
    { label: 'Produtos', icon: '📦', route: '/admin/produtos' },
    { label: 'Categorias', icon: '🏷️', route: '/admin/categorias' },
    { label: 'Pedidos', icon: '🛒', route: '/admin/pedidos' },
    { label: 'Clientes', icon: '👥', route: '/admin/clientes' },
    { label: 'Configurações', icon: '⚙️', route: '/admin/configuracoes' },
  ];

  constructor(public sidebarService: SidebarService) {}

  onLinkClick() {
    this.sidebarService.closeSidebar();
  }
}
