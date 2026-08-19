import { ChangeDetectionStrategy, Component, input, OnChanges, output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { EcommerceTest, TestingFormValue } from '../../data-access/testing.models';
import {
  TESTING_ASSOCIATION_OPTIONS,
  TESTING_STATUS_OPTIONS,
  TESTING_TYPE_OPTIONS,
} from '../../utils/testing.constants';

interface TestingFormControls {
  readonly code: FormControl<string>;
  readonly name: FormControl<string>;
  readonly description: FormControl<string>;
  readonly type: FormControl<TestingFormValue['type']>;
  readonly status: FormControl<TestingFormValue['status']>;
  readonly objective: FormControl<string>;
  readonly hypothesis: FormControl<string>;
  readonly associationType: FormControl<TestingFormValue['associationType']>;
  readonly associationEntityId: FormControl<string>;
  readonly associationLabel: FormControl<string>;
  readonly startDate: FormControl<string>;
  readonly endDate: FormControl<string>;
  readonly owner: FormControl<string>;
  readonly resultSummary: FormControl<string>;
  readonly winner: FormControl<string>;
}

@Component({
  selector: 'app-testing-form',
  imports: [ReactiveFormsModule],
  templateUrl: './testing-form.html',
  styleUrl: './testing-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestingFormComponent implements OnChanges {
  readonly test = input<EcommerceTest | null>(null);
  readonly saving = input(false);
  readonly validationErrors = input<readonly string[]>([]);
  readonly submitForm = output<TestingFormValue>();
  readonly cancel = output<void>();
  readonly typeOptions = TESTING_TYPE_OPTIONS.filter((option) => option.value !== 'all');
  readonly statusOptions = TESTING_STATUS_OPTIONS.filter((option) => option.value !== 'all');
  readonly associationOptions = TESTING_ASSOCIATION_OPTIONS.filter((option) => option.value !== 'all');

  readonly form = new FormGroup<TestingFormControls>({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    type: new FormControl('campaign', { nonNullable: true }),
    status: new FormControl('draft', { nonNullable: true }),
    objective: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    hypothesis: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    associationType: new FormControl('none', { nonNullable: true }),
    associationEntityId: new FormControl('', { nonNullable: true }),
    associationLabel: new FormControl('Sin asociacion', { nonNullable: true }),
    startDate: new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true }),
    owner: new FormControl('Administrador', { nonNullable: true, validators: [Validators.required] }),
    resultSummary: new FormControl('', { nonNullable: true }),
    winner: new FormControl('', { nonNullable: true }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['test']) {
      const test = this.test();
      this.form.setValue({
        code: test?.code ?? '',
        name: test?.name ?? '',
        description: test?.description ?? '',
        type: test?.type ?? 'campaign',
        status: test?.status ?? 'draft',
        objective: test?.objective ?? '',
        hypothesis: test?.hypothesis ?? '',
        associationType: test?.association.type ?? 'none',
        associationEntityId: test?.association.entityId ?? '',
        associationLabel: test?.association.label ?? 'Sin asociacion',
        startDate: test?.startDate ?? new Date().toISOString().slice(0, 10),
        endDate: test?.endDate ?? '',
        owner: test?.owner ?? 'Administrador',
        resultSummary: test?.resultSummary ?? '',
        winner: test?.winner ?? '',
      });
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitForm.emit(this.form.getRawValue());
  }
}
