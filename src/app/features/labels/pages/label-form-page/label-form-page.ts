import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { LabelFormComponent } from '../../components/label-form/label-form';
import { TagFormValue } from '../../data-access/tags.models';
import { TagsStore } from '../../data-access/tags.store';

@Component({
  selector: 'app-label-form-page',
  imports: [LabelFormComponent],
  providers: [TagsStore],
  templateUrl: './label-form-page.html',
  styleUrl: './label-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(TagsStore);

  readonly tag = this.store.selectedTag;
  readonly saving = this.store.saving;
  readonly loading = this.store.loadingDetail;
  readonly error = this.store.error;
  readonly validationErrors = this.store.validationErrors;
  readonly title = this.route.snapshot.paramMap.get('id') ? 'Editar etiqueta' : 'Nueva etiqueta';

  private get tagId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.store.loadTags();
    const id = this.tagId;
    if (id) this.store.loadTag(id);
  }

  save(value: TagFormValue): void {
    const id = this.tagId;
    if (id) {
      this.store.update(id, value, (tag) => void this.router.navigate(['/etiquetas', tag.id]));
      return;
    }

    this.store.create(value, (tag) => void this.router.navigate(['/etiquetas', tag.id]));
  }

  cancel(): void {
    void this.router.navigate(['/etiquetas']);
  }
}
