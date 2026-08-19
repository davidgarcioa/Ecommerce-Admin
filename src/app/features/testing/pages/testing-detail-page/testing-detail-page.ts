import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { TestingDetailCardComponent } from '../../components/testing-detail-card/testing-detail-card';
import { TestingStore } from '../../data-access/testing.store';

@Component({
  selector: 'app-testing-detail-page',
  imports: [TestingDetailCardComponent],
  providers: [TestingStore],
  templateUrl: './testing-detail-page.html',
  styleUrl: './testing-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestingDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(TestingStore);

  readonly test = this.store.selectedTest;
  readonly loading = this.store.loadingDetail;
  readonly error = this.store.error;
  readonly canUpdate = this.store.canUpdate;
  readonly canArchive = this.store.canArchive;
  readonly canDelete = this.store.canDelete;

  private get testId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.store.loadTest(this.testId);
  }

  edit(): void {
    void this.router.navigate(['/testeos', this.testId, 'editar']);
  }

  archive(): void {
    this.store.archive(this.testId);
  }

  restore(): void {
    this.store.restore(this.testId);
  }

  deleteTest(): void {
    this.store.delete(this.testId, () => void this.router.navigate(['/testeos']));
  }
}
