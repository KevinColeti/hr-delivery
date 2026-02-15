import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-admin-header',
  imports: [],
  templateUrl: './admin-header.html',
  styleUrl: './admin-header.css',
})
/**
 * Header operacional do painel administrativo.
 *
 * Mantem atalhos globais de navegação (toggle sidebar) e controle de sessão.
 */
export class AdminHeaderComponent {
  /**
   * Injeta estado de layout, sessao e roteamento.
   */
  constructor(
    public sidebarService: SidebarService,
    public authService: AdminAuthService,
    private readonly router: Router,
  ) {}

  /**
   * Alterna sidebar entre expandida/reduzida conforme contexto de viewport.
   */
  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  /**
   * Encerra sessao administrativa e retorna para login.
   */
  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/admin/login');
  }
}
