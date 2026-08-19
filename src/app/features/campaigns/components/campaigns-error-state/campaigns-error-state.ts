import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-campaigns-error-state',
  templateUrl: './campaigns-error-state.html',
  styleUrl: './campaigns-error-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsErrorStateComponent {
  readonly message = input.required<string>();
  readonly retry = output<void>();
}
