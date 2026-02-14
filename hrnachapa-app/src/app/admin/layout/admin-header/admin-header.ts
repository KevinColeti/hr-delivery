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
export class AdminHeaderComponent {
  constructor(
    public sidebarService: SidebarService,
    public authService: AdminAuthService,
    private readonly router: Router,
  ) {}

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
