import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ExpenseFormComponent } from '../../components/expense-form/expense-form';
import { CreateExpenseRequest, UpdateExpenseRequest } from '../../data-access/expenses.models';
import { ExpensesStore } from '../../data-access/expenses.store';

@Component({
  selector: 'app-expense-form-page',
  imports: [ExpenseFormComponent],
  providers: [ExpensesStore],
  templateUrl: './expense-form-page.html',
  styleUrl: './expense-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseFormPageComponent implements OnInit {
  private readonly store = inject(ExpensesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly expense = this.store.selectedExpense;
  readonly saving = this.store.saving;
  readonly error = this.store.error;
  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly mode: 'create' | 'edit' = this.id ? 'edit' : 'create';

  ngOnInit(): void {
    if (this.id) this.store.loadExpense(this.id);
  }

  cancel(): void {
    void this.router.navigate(['/gastos']);
  }

  create(payload: CreateExpenseRequest): void {
    this.store.create(payload, (expense) => void this.router.navigate(['/gastos', expense.id]));
  }

  update(payload: UpdateExpenseRequest): void {
    if (!this.id) return;
    this.store.update(
      this.id,
      payload,
      (expense) => void this.router.navigate(['/gastos', expense.id]),
    );
  }
}
