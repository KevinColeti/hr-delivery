import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-forbidden',
  imports: [RouterLink],
  templateUrl: './admin-forbidden.html',
  styleUrl: './admin-forbidden.css',
})
/**
 * Tela para acesso negado por perfil.
 *
 * Usada quando usuario autenticado tenta abrir rota sem permissao de role.
 */
export class AdminForbiddenComponent {}
