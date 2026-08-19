import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SettingsStore } from '../../data-access/settings.store';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  private readonly store = inject(SettingsStore);

  readonly profile = this.store.profile;
  readonly permissions = this.store.profile;
}
