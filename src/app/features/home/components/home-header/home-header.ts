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
  readonly roleLabel = input.required<string>();
  readonly currentDate = input.required<string>();

  roleIcon(): string {
    const role = this.roleLabel().toLowerCase();

    if (role.includes('admin')) return 'admin_panel_settings';
    if (role.includes('supervisor')) return 'manage_accounts';
    if (role.includes('operador')) return 'support_agent';
    if (role.includes('analista')) return 'query_stats';
    if (role.includes('consulta')) return 'visibility';

    return 'person';
  }
}
