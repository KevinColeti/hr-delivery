import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-placeholder',
  imports: [],
  templateUrl: './admin-placeholder.html',
  styleUrl: './admin-placeholder.css',
})
/**
 * Tela temporaria para modulos administrativos ainda nao implementados.
 */
export class AdminPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  readonly pageTitle = computed(
    () => (this.route.snapshot.data['title'] as string | undefined) ?? 'Modulo',
  );
}

