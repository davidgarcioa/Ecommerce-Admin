import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ADMIN_NAVIGATION_ITEMS } from '../../core/constants/navigation.constants';
import { NAVIGATION_PERMISSIONS } from '../../core/constants/navigation-permissions.constants';
import { PermissionsService } from '../../core/services/permissions.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly permissions = inject(PermissionsService);
  readonly collapsed = input.required<boolean>();
  readonly toggleSidebar = output<void>();
  readonly navigationItems = computed(() =>
    ADMIN_NAVIGATION_ITEMS.filter((item) => {
      const requiredPermissions = NAVIGATION_PERMISSIONS[item.id];
      return item.visible && (!requiredPermissions || this.permissions.hasAny(requiredPermissions));
    }),
  );

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
