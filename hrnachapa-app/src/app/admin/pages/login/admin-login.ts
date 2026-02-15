import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
/**
 * Tela de login do backoffice.
 *
 * Responsabilidades:
 * - autenticar operador (`admin`/`kitchen`);
 * - respeitar retorno para rota originalmente solicitada;
 * - exibir erros de credencial de forma clara.
 */
export class AdminLoginComponent implements OnInit {
  credentials = {
    email: '',
    password: '',
  };
  isSubmitting = false;
  errorMessage = '';

  /**
   * Injeta serviços de autenticacao e navegacao da tela de login.
   */
  constructor(
    private readonly authService: AdminAuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  /**
   * Evita exibir login quando sessao administrativa ja esta ativa.
   */
  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl('/admin/dashboard');
    }
  }

  /**
   * Envia credenciais para API e redireciona para destino desejado.
   */
  submit() {
    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(this.credentials.email, this.credentials.password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || '/admin/dashboard');
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error?.error?.message && typeof error.error.message === 'string'
            ? error.error.message
            : 'Falha no login administrativo.';
      },
    });
  }
}
