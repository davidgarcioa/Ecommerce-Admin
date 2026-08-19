import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SettingsStore } from '../../data-access/settings.store';

@Component({
  selector: 'app-role-detail-page',
  imports: [RouterLink],
  templateUrl: './role-detail-page.html',
  styleUrl: './role-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDetailPageComponent {
  readonly id = input.required<string>();

  private readonly store = inject(SettingsStore);
  private readonly router = inject(Router);

  readonly role = computed(() => this.store.roles().find((role) => role.id === this.id()) ?? null);

  edit(): void {
    void this.router.navigate(['/configuracion/roles', this.id(), 'editar']);
  }
}
