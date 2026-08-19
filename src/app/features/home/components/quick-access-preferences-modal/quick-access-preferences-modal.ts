import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { HomeQuickAccessItem } from '../../data-access/home.models';

@Component({
  selector: 'app-quick-access-preferences-modal',
  templateUrl: './quick-access-preferences-modal.html',
  styleUrl: './quick-access-preferences-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickAccessPreferencesModalComponent {
  readonly items = input.required<readonly HomeQuickAccessItem[]>();
  readonly selectedItemIds = input.required<readonly string[]>();
  readonly close = output<void>();
  readonly toggleItem = output<string>();

  isSelected(itemId: string): boolean {
    return this.selectedItemIds().includes(itemId);
  }
}
