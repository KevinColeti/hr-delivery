import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isMobile = signal(window.innerWidth < 768);
  isOpen = signal(true);
  isMini = signal(false);

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
      if (this.isMobile()) {
        this.isOpen.set(false);
      } else {
        this.isOpen.set(true);
      }
    });

    if (this.isMobile()) {
      this.isOpen.set(false);
    }
  }

  toggleSidebar() {
    if (this.isMobile()) {
      this.isOpen.update(value => !value);
    } else {
      this.isMini.update(value => !value);
    }
  }

  closeSidebar() {
    if (this.isMobile()) {
      this.isOpen.set(false);
    }
  }
}
