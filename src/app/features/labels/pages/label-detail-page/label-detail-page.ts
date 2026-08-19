import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { LabelDetailCardComponent } from '../../components/label-detail-card/label-detail-card';
import { TagsStore } from '../../data-access/tags.store';

@Component({
  selector: 'app-label-detail-page',
  imports: [LabelDetailCardComponent],
  providers: [TagsStore],
  templateUrl: './label-detail-page.html',
  styleUrl: './label-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(TagsStore);

  readonly tag = this.store.selectedTag;
  readonly loading = this.store.loadingDetail;
  readonly error = this.store.error;
  readonly canUpdate = this.store.canUpdate;
  readonly canArchive = this.store.canArchive;
  readonly canDelete = this.store.canDelete;

  private get tagId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.store.loadTag(this.tagId);
  }

  edit(): void {
    void this.router.navigate(['/etiquetas', this.tagId, 'editar']);
  }

  archive(): void {
    this.store.archive(this.tagId);
  }

  restore(): void {
    this.store.restore(this.tagId);
  }

  deleteTag(): void {
    this.store.delete(this.tagId, () => void this.router.navigate(['/etiquetas']));
  }
}
