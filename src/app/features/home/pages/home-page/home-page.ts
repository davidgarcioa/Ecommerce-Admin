import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';

import { HomeHeaderComponent } from '../../components/home-header/home-header';
import { HomeWorkItemsComponent } from '../../components/home-work-items/home-work-items';
import { QuickAccessGridComponent } from '../../components/quick-access-grid/quick-access-grid';
import { HomeStore } from '../../data-access/home.store';

@Component({
  selector: 'app-home-page',
  imports: [HomeHeaderComponent, QuickAccessGridComponent, HomeWorkItemsComponent],
  providers: [HomeStore],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit {
  private readonly store = inject(HomeStore);

  readonly greeting = this.store.greeting;
  readonly userName = this.store.userName;
  readonly userRoleLabel = this.store.userRoleLabel;
  readonly currentDate = this.store.currentDate;
  readonly availableQuickAccessItems = this.store.availableQuickAccessItems;
  readonly selectedQuickAccessItemIds = this.store.selectedQuickAccessItemIds;
  readonly quickAccessItems = this.store.visibleQuickAccessItems;
  readonly workItems = this.store.visibleWorkItems;
  readonly hasWorkItems = this.store.hasWorkItems;
  readonly partialErrors = this.store.partialErrors;
  readonly error = this.store.error;

  ngOnInit(): void {
    this.store.load();
  }

  refresh(): void {
    this.store.load();
  }

  toggleQuickAccessItem(itemId: string): void {
    this.store.toggleQuickAccessItem(itemId);
  }
}
