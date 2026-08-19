import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  TESTING_ASSOCIATION_OPTIONS,
  TESTING_STATUS_OPTIONS,
  TESTING_TYPE_OPTIONS,
} from '../../utils/testing.constants';
import { TestingFilters } from '../../data-access/testing.models';

interface TestingFiltersForm {
  readonly status: FormControl<TestingFilters['status']>;
  readonly type: FormControl<TestingFilters['type']>;
  readonly associationType: FormControl<TestingFilters['associationType']>;
}

@Component({
  selector: 'app-testing-filters',
  imports: [ReactiveFormsModule],
  templateUrl: './testing-filters.html',
  styleUrl: './testing-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestingFiltersComponent {
  readonly applyFilters = output<TestingFilters>();
  readonly clear = output<void>();
  readonly statusOptions = TESTING_STATUS_OPTIONS;
  readonly typeOptions = TESTING_TYPE_OPTIONS;
  readonly associationOptions = TESTING_ASSOCIATION_OPTIONS;

  readonly form = new FormGroup<TestingFiltersForm>({
    status: new FormControl('all', { nonNullable: true }),
    type: new FormControl('all', { nonNullable: true }),
    associationType: new FormControl('all', { nonNullable: true }),
  });

  protected onApply(): void {
    this.applyFilters.emit(this.form.getRawValue());
  }

  protected onClear(): void {
    this.form.setValue({ status: 'all', type: 'all', associationType: 'all' });
    this.clear.emit();
  }
}
