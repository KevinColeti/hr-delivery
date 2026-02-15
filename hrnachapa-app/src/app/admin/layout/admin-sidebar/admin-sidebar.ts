import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css',
})
/**
 * Sidebar principal do admin com menu condicionado por perfil.
 */
export class AdminSidebarComponent {
  menuItems = [
    { label: 'Dashboard', shortLabel: 'DB', route: '/admin/dashboard', roles: ['admin', 'kitchen'] },
    { label: 'Pedidos', shortLabel: 'PD', route: '/admin/pedidos', roles: ['admin'] },
    { label: 'Cozinha', shortLabel: 'CZ', route: '/admin/cozinha', roles: ['admin', 'kitchen'] },
    { label: 'Cardapio', shortLabel: 'CD', route: '/admin/cardapio', roles: ['admin'] },
    { label: 'Estoque', shortLabel: 'ES', route: '/admin/estoque', roles: ['admin'] },
    { label: 'Promocoes', shortLabel: 'PR', route: '/admin/promocoes', roles: ['admin'] },
    { label: 'Clientes', shortLabel: 'CL', route: '/admin/clientes', roles: ['admin'] },
    { label: 'Configuracoes', shortLabel: 'CF', route: '/admin/configuracoes', roles: ['admin'] },
  ];

  /**
   * Injeta estado responsivo da sidebar e sessao do operador.
   */
  constructor(
    public sidebarService: SidebarService,
    public authService: AdminAuthService,
  ) {}

  /**
   * Fecha sidebar em mobile apos clicar em uma opcao para liberar area util.
   */
  onLinkClick() {
    this.sidebarService.closeSidebar();
  }

  /**
   * Oculta links que nao fazem parte do perfil atual.
   */
  canRenderMenuItem(item: { roles: string[] }) {
    return this.authService.hasAnyRole(item.roles as ('admin' | 'kitchen')[]);
  }
}
