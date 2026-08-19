import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { TAG_STATUS_OPTIONS, TAG_USAGE_OPTIONS } from '../../utils/tags.constants';
import { TagFilters } from '../../data-access/tags.models';

interface LabelsFiltersForm {
  readonly status: FormControl<TagFilters['status']>;
  readonly usage: FormControl<TagFilters['usage']>;
}

@Component({
  selector: 'app-labels-filters',
  imports: [ReactiveFormsModule],
  templateUrl: './labels-filters.html',
  styleUrl: './labels-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelsFiltersComponent {
  readonly filters = input.required<TagFilters>();
  readonly applyFilters = output<TagFilters>();
  readonly clear = output<void>();

  readonly statusOptions = TAG_STATUS_OPTIONS;
  readonly usageOptions = TAG_USAGE_OPTIONS;

  readonly form = new FormGroup<LabelsFiltersForm>({
    status: new FormControl('all', { nonNullable: true }),
    usage: new FormControl('all', { nonNullable: true }),
  });

  protected onApply(): void {
    this.applyFilters.emit(this.form.getRawValue());
  }

  protected onClear(): void {
    this.form.setValue({ status: 'all', usage: 'all' });
    this.clear.emit();
  }
}
