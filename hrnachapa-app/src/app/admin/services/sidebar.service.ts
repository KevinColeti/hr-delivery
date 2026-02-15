import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
/**
 * Controla comportamento responsivo da sidebar administrativa.
 *
 * Estados:
 * - `isMobile`: define se layout deve operar em modo sobreposto;
 * - `isOpen`: controla visibilidade em telas pequenas;
 * - `isMini`: controla versão compacta em desktop.
 */
export class SidebarService {
  isMobile = signal(window.innerWidth < 768);
  isOpen = signal(true);
  isMini = signal(false);

  /**
   * Inicializa listeners de resize e estado inicial conforme viewport.
   */
  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
      if (this.isMobile()) {
        this.isOpen.set(false);
      } else {
        this.isOpen.set(true);
      }
    });

    // Em mobile priorizamos conteudo principal no primeiro paint,
    // por isso iniciamos a sidebar fechada.
    if (this.isMobile()) {
      this.isOpen.set(false);
    }
  }

  /**
   * Alterna modo da sidebar respeitando contexto mobile/desktop.
   */
  toggleSidebar() {
    if (this.isMobile()) {
      this.isOpen.update(value => !value);
    } else {
      this.isMini.update(value => !value);
    }
  }

  /**
   * Fecha sidebar no modo mobile.
   */
  closeSidebar() {
    if (this.isMobile()) {
      this.isOpen.set(false);
    }
  }
}
