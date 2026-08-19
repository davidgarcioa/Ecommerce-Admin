import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-incident-detail-page',
  imports: [],
  templateUrl: './incident-detail-page.html',
  styleUrl: './incident-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentDetailPageComponent {
  private readonly router = inject(Router);

  back(): void {
    void this.router.navigate(['/torre-logistica/incidencias']);
  }
}
