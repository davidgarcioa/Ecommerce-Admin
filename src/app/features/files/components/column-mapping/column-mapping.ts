import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ColumnMapping } from '../../models/column-mapping.model';
import { ImportColumnDefinition } from '../../models/import-column.model';

@Component({
  selector: 'app-column-mapping',
  templateUrl: './column-mapping.html',
  styleUrl: './column-mapping.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnMappingComponent {
  readonly definitions = input.required<readonly ImportColumnDefinition[]>();
  readonly mappings = input.required<readonly ColumnMapping[]>();
  readonly headers = input.required<readonly string[]>();
  readonly mappingChange = output<ColumnMapping>();
  readonly validate = output<void>();

  getMapping(key: string): ColumnMapping | null {
    return this.mappings().find((mapping) => mapping.systemColumnKey === key) ?? null;
  }

  getSelectableHeaders(definition: ImportColumnDefinition): readonly string[] {
    const headers = this.headers();
    const mappedHeader = this.getMapping(definition.key)?.sourceColumnName;
    if (!mappedHeader || headers.includes(mappedHeader)) {
      return headers;
    }

    return [mappedHeader, ...headers];
  }

  onSelect(definition: ImportColumnDefinition, event: Event): void {
    const current = this.getMapping(definition.key);
    this.mappingChange.emit({
      systemColumnKey: definition.key,
      sourceColumnName: (event.target as HTMLSelectElement).value || undefined,
      confidence: current?.confidence ?? 100,
      manuallySelected: true,
      status: 'mapped',
    });
  }
}
