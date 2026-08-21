import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SettingsStore } from '../../data-access/settings.store';

@Component({
  selector: 'app-settings-shell',
  imports: [RouterOutlet],
  providers: [SettingsStore],
  templateUrl: './settings-shell.html',
  styleUrl: './settings-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsShellComponent implements OnInit {
  private readonly store = inject(SettingsStore);

  readonly loading = this.store.loading;
  readonly error = this.store.error;

  ngOnInit(): void {
    this.store.loadSettings();
  }

  refresh(): void {
    this.store.loadSettings();
  }
}
