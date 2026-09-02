import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DemoDataCleanupService } from './core/services/demo-data-cleanup.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly demoCleanup = inject(DemoDataCleanupService);
  private readonly theme = inject(ThemeService);
}
