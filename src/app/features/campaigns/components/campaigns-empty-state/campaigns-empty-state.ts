import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-campaigns-empty-state',
  templateUrl: './campaigns-empty-state.html',
  styleUrl: './campaigns-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsEmptyStateComponent {
  readonly clear = output<void>();
}
