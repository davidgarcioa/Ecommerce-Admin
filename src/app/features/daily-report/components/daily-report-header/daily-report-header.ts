import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-daily-report-header',
  templateUrl: './daily-report-header.html',
  styleUrl: './daily-report-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyReportHeaderComponent {}
