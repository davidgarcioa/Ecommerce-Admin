import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { PermissionsService } from '../../../../core/services/permissions.service';
import { SETTINGS_TABS } from '../../utils/settings.constants';
import { SettingsStore } from '../../data-access/settings.store';

@Component({
  selector: 'app-settings-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  providers: [SettingsStore],
  templateUrl: './settings-shell.html',
  styleUrl: './settings-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsShellComponent implements OnInit {
  private readonly permissions = inject(PermissionsService);
  private readonly store = inject(SettingsStore);

  readonly tabs = SETTINGS_TABS.filter((tab) => this.permissions.hasAny(tab.permissions));
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  ngOnInit(): void {
    this.store.loadSettings();
  }

  refresh(): void {
    this.store.loadSettings();
  }
}
