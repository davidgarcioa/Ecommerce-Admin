import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HomeQuickAccessItem } from '../../data-access/home.models';
import { QuickAccessPreferencesModalComponent } from '../quick-access-preferences-modal/quick-access-preferences-modal';

@Component({
  selector: 'app-quick-access-grid',
  imports: [RouterLink, QuickAccessPreferencesModalComponent],
  templateUrl: './quick-access-grid.html',
  styleUrl: './quick-access-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickAccessGridComponent {
  readonly items = input.required<readonly HomeQuickAccessItem[]>();
  readonly availableItems = input<readonly HomeQuickAccessItem[]>([]);
  readonly selectedItemIds = input<readonly string[]>([]);
  readonly toggleItem = output<string>();
  readonly preferencesOpen = signal(false);

  openPreferences(): void {
    this.preferencesOpen.set(true);
  }

  closePreferences(): void {
    this.preferencesOpen.set(false);
  }

  isSelected(itemId: string): boolean {
    return this.selectedItemIds().includes(itemId);
  }

  onToggleItem(itemId: string): void {
    this.toggleItem.emit(itemId);
  }
}
