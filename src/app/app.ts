import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { OperationalStorageResetService } from './core/services/operational-storage-reset.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly theme = inject(ThemeService);
  private readonly operationalStorageReset = inject(OperationalStorageResetService);
}
