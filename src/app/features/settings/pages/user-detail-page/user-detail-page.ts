import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SettingsStore } from '../../data-access/settings.store';

@Component({
  selector: 'app-user-detail-page',
  imports: [RouterLink],
  templateUrl: './user-detail-page.html',
  styleUrl: './user-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailPageComponent {
  readonly id = input.required<string>();

  private readonly store = inject(SettingsStore);
  private readonly router = inject(Router);

  readonly user = computed(() => this.store.users().find((user) => user.id === this.id()) ?? null);

  edit(): void {
    void this.router.navigate(['/configuracion/usuarios', this.id(), 'editar']);
  }
}
