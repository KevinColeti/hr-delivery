import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { tap } from 'rxjs';

export type AdminUserRole = 'admin' | 'kitchen';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminUserRole;
}

interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Gerencia autenticacao do frontend administrativo.
 *
 * Mantemos token e usuario em localStorage para sobreviver refresh
 * e reduzir friccao operacional durante uso de backoffice.
 */
export class AdminAuthService {
  private readonly tokenStorageKey = 'hrnachapa_admin_token_v1';
  private readonly userStorageKey = 'hrnachapa_admin_user_v1';
  private readonly tokenSignal = signal<string | null>(this.loadTokenFromStorage());
  private readonly userSignal = signal<AdminUser | null>(this.loadUserFromStorage());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.tokenSignal()));

  /**
   * Injeta cliente HTTP para autenticacao e carga de sessao.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Executa login administrativo e persiste sessao local.
   */
  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>('http://localhost:3000/auth/login', { email, password })
      .pipe(tap((response) => this.setSession(response.accessToken, response.user)));
  }

  /**
   * Limpa sessao local no logout.
   */
  logout() {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
  }

  /**
   * Valida se usuario atual possui um dos papeis exigidos.
   */
  hasAnyRole(roles: AdminUserRole[]) {
    const currentUser = this.userSignal();
    if (!currentUser) {
      return false;
    }

    // Verificamos intersecao simples para manter a regra de permissao
    // previsivel e reaproveitavel entre guard e menu lateral.
    return roles.includes(currentUser.role);
  }

  /**
   * Persiste dados de sessao de forma centralizada.
   */
  private setSession(accessToken: string, user: AdminUser) {
    this.tokenSignal.set(accessToken);
    this.userSignal.set(user);
    localStorage.setItem(this.tokenStorageKey, accessToken);
    localStorage.setItem(this.userStorageKey, JSON.stringify(user));
  }

  /**
   * Carrega token persistido.
   */
  private loadTokenFromStorage() {
    const token = localStorage.getItem(this.tokenStorageKey);
    return token && token.trim().length > 0 ? token : null;
  }

  /**
   * Carrega usuario persistido com fallback seguro.
   */
  private loadUserFromStorage(): AdminUser | null {
    const rawUser = localStorage.getItem(this.userStorageKey);
    if (!rawUser) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawUser);
      if (
        typeof parsed?.id === 'number' &&
        typeof parsed?.name === 'string' &&
        typeof parsed?.email === 'string' &&
        (parsed?.role === 'admin' || parsed?.role === 'kitchen')
      ) {
        return parsed as AdminUser;
      }

      return null;
    } catch {
      return null;
    }
  }
}
