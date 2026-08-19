import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Tag } from '../../data-access/tags.models';
import { formatTagDate, formatTagStatus, resolveSafeTagColor } from '../../utils/tags.formatters';

@Component({
  selector: 'app-label-detail-card',
  templateUrl: './label-detail-card.html',
  styleUrl: './label-detail-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelDetailCardComponent {
  readonly tag = input.required<Tag>();
  readonly canUpdate = input(false);
  readonly canArchive = input(false);
  readonly canDelete = input(false);
  readonly edit = output<void>();
  readonly archive = output<void>();
  readonly restore = output<void>();
  readonly deleteTag = output<void>();

  protected formatDate(value: string): string {
    return formatTagDate(value);
  }

  protected statusLabel(value: Tag['status']): string {
    return formatTagStatus(value);
  }

  protected color(value: string | undefined): string {
    return resolveSafeTagColor(value);
  }
}
