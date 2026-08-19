import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ImportTemplate } from '../../models/import-template.model';

@Component({
  selector: 'app-template-download-panel',
  templateUrl: './template-download-panel.html',
  styleUrl: './template-download-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateDownloadPanelComponent {
  readonly templates = input.required<readonly ImportTemplate[]>();
  readonly close = output<void>();
  readonly download = output<string>();

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }
}
