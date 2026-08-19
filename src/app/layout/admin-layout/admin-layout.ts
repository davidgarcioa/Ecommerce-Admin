import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LayoutStateService } from '../../core/services/layout-state.service';
import { PageContainer } from '../page-container/page-container';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, Sidebar, Topbar, PageContainer],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  private readonly layoutState = inject(LayoutStateService);
  readonly isSidebarCollapsed = this.layoutState.isSidebarCollapsed;

  toggleSidebar(): void {
    this.layoutState.toggleSidebar();
  }
}
