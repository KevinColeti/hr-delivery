import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar';
import { AdminHeaderComponent } from '../admin-header/admin-header';
import { AdminFooterComponent } from '../admin-footer/admin-footer';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, AdminSidebarComponent, AdminHeaderComponent, AdminFooterComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
/**
 * Casca de layout compartilhada entre modulos administrativos.
 */
export class AdminLayoutComponent {}
