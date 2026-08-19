import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-incidents-page',
  imports: [],
  templateUrl: './incidents-page.html',
  styleUrl: './incidents-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentsPageComponent {
  private readonly router = inject(Router);

  back(): void {
    void this.router.navigate(['/torre-logistica']);
  }
}
