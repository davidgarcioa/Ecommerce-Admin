import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';

import { ExpenseDetailCardComponent } from '../../components/expense-detail-card/expense-detail-card';
import { ExpensesStore } from '../../data-access/expenses.store';

@Component({
  selector: 'app-expense-detail-page',
  imports: [ExpenseDetailCardComponent, RouterLink],
  providers: [ExpensesStore],
  templateUrl: './expense-detail-page.html',
  styleUrl: './expense-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseDetailPageComponent implements OnInit {
  private readonly store = inject(ExpensesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly expense = this.store.selectedExpense;
  readonly loading = this.store.loadingDetail;
  readonly error = this.store.error;
  private readonly id = this.route.snapshot.paramMap.get('id');

  ngOnInit(): void {
    if (this.id) this.store.loadExpense(this.id);
  }

  edit(id: string): void {
    void this.router.navigate(['/gastos', id, 'editar']);
  }

  delete(id: string): void {
    this.store.delete(id, () => void this.router.navigate(['/gastos']));
  }
}
