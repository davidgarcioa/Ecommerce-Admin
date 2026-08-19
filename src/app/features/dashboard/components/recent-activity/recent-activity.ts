import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface RecentActivityItem {
  readonly message: string;
  readonly timestamp: string;
  readonly icon: string;
}

@Component({
  selector: 'app-recent-activity',
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivityComponent {
  readonly items = input.required<readonly RecentActivityItem[]>();
}
