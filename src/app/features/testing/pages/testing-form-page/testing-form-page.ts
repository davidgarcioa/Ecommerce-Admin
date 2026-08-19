import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { TestingFormComponent } from '../../components/testing-form/testing-form';
import { TestingFormValue } from '../../data-access/testing.models';
import { TestingStore } from '../../data-access/testing.store';

@Component({
  selector: 'app-testing-form-page',
  imports: [TestingFormComponent],
  providers: [TestingStore],
  templateUrl: './testing-form-page.html',
  styleUrl: './testing-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestingFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(TestingStore);

  readonly test = this.store.selectedTest;
  readonly saving = this.store.saving;
  readonly loading = this.store.loadingDetail;
  readonly error = this.store.error;
  readonly validationErrors = this.store.validationErrors;
  readonly title = this.route.snapshot.paramMap.get('id') ? 'Editar testeo' : 'Nuevo testeo';

  private get testId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.store.loadTests();
    const id = this.testId;
    if (id) this.store.loadTest(id);
  }

  save(value: TestingFormValue): void {
    const id = this.testId;
    if (id) {
      this.store.update(id, value, (test) => void this.router.navigate(['/testeos', test.id]));
      return;
    }
    this.store.create(value, (test) => void this.router.navigate(['/testeos', test.id]));
  }

  cancel(): void {
    void this.router.navigate(['/testeos']);
  }
}
