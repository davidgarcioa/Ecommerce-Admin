import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  CreateExpenseRequest,
  Expense,
  ExpenseFormValue,
  UpdateExpenseRequest,
} from '../../data-access/expenses.models';
import { readExpenseMetadata } from '../../data-access/expenses.mapper';
import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_PAYMENT_METHOD_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
} from '../../utils/expenses.constants';
import { isFinitePositiveAmount, normalizeExpenseText } from '../../utils/expenses.validators';

type ExpenseForm = FormGroup<{
  concept: FormControl<string>;
  description: FormControl<string>;
  amount: FormControl<number>;
  status: FormControl<'pending' | 'paid' | 'cancelled'>;
  category: FormControl<'advertising' | 'logistics' | 'office' | 'services' | 'supplies' | 'other'>;
  paymentMethod: FormControl<'cash' | 'bank-transfer' | 'card' | 'nequi' | 'daviplata' | 'other'>;
  responsible: FormControl<string>;
  supplier: FormControl<string>;
  expenseDate: FormControl<string>;
  dueDate: FormControl<string>;
  paymentDate: FormControl<string>;
  reference: FormControl<string>;
  receiptUrl: FormControl<string>;
  notes: FormControl<string>;
}>;

@Component({
  selector: 'app-expense-form',
  imports: [ReactiveFormsModule],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseFormComponent {
  readonly expense = input<Expense | null>(null);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly mode = input<'create' | 'edit'>('create');

  readonly cancel = output<void>();
  readonly create = output<CreateExpenseRequest>();
  readonly update = output<UpdateExpenseRequest>();

  protected readonly statuses = EXPENSE_STATUS_OPTIONS;
  protected readonly categories = EXPENSE_CATEGORY_OPTIONS;
  protected readonly paymentMethods = EXPENSE_PAYMENT_METHOD_OPTIONS;

  protected readonly form: ExpenseForm = new FormGroup({
    concept: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(140)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    amount: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    status: new FormControl<'pending' | 'paid' | 'cancelled'>('pending', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    category: new FormControl<
      'advertising' | 'logistics' | 'office' | 'services' | 'supplies' | 'other'
    >('other', { nonNullable: true, validators: [Validators.required] }),
    paymentMethod: new FormControl<
      'cash' | 'bank-transfer' | 'card' | 'nequi' | 'daviplata' | 'other'
    >('bank-transfer', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    responsible: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    supplier: new FormControl('', { nonNullable: true }),
    expenseDate: new FormControl(new Date().toISOString().slice(0, 10), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    dueDate: new FormControl('', { nonNullable: true }),
    paymentDate: new FormControl('', { nonNullable: true }),
    reference: new FormControl('', { nonNullable: true }),
    receiptUrl: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const expense = this.expense();
      if (!expense) return;
      const metadata = readExpenseMetadata(expense.metadata);
      this.form.reset({
        concept: expense.name,
        description: expense.description ?? '',
        amount: metadata.amount,
        status: metadata.status,
        category: metadata.category,
        paymentMethod: metadata.paymentMethod,
        responsible: metadata.responsible === 'Sin responsable' ? '' : metadata.responsible,
        supplier: metadata.supplier ?? '',
        expenseDate: metadata.expenseDate,
        dueDate: metadata.dueDate ?? '',
        paymentDate: metadata.paymentDate ?? '',
        reference: metadata.reference ?? '',
        receiptUrl: metadata.receiptUrl ?? '',
        notes: metadata.notes ?? '',
      });
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid || !isFinitePositiveAmount(value.amount) || this.saving()) return;

    const payload = toRequest(value);
    if (this.mode() === 'create') {
      this.create.emit(payload);
      return;
    }

    this.update.emit(payload);
  }

  protected conceptError(): string | null {
    const control = this.form.controls.concept;
    return control.touched && control.invalid
      ? 'El concepto debe tener entre 2 y 140 caracteres.'
      : null;
  }

  protected amountError(): string | null {
    const control = this.form.controls.amount;
    return control.touched && !isFinitePositiveAmount(control.value)
      ? 'El valor debe ser mayor que cero.'
      : null;
  }
}

function toRequest(value: ExpenseFormValue): CreateExpenseRequest {
  return {
    name: normalizeExpenseText(value.concept),
    description: normalizeExpenseText(value.description) || undefined,
    metadata: {
      amount: value.amount,
      currency: 'COP',
      status: value.status,
      category: value.category,
      paymentMethod: value.paymentMethod,
      responsible: normalizeExpenseText(value.responsible),
      supplier: normalizeExpenseText(value.supplier) || undefined,
      expenseDate: value.expenseDate,
      dueDate: value.dueDate || undefined,
      paymentDate: value.paymentDate || undefined,
      reference: normalizeExpenseText(value.reference) || undefined,
      receiptUrl: normalizeExpenseText(value.receiptUrl) || undefined,
      notes: normalizeExpenseText(value.notes) || undefined,
    },
  };
}
