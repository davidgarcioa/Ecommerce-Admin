import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-home-header',
  imports: [],
  templateUrl: './home-header.html',
  styleUrl: './home-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeaderComponent {
  readonly greeting = input.required<string>();
  readonly userName = input.required<string>();
  readonly currentDate = input.required<string>();
}
