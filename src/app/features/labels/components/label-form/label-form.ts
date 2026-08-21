import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnChanges,
  output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Tag, TagFormValue } from '../../data-access/tags.models';
import { DEFAULT_TAG_COLOR } from '../../utils/tags.constants';
import { resolveSafeTagColor } from '../../utils/tags.formatters';

interface LabelFormControls {
  readonly code: FormControl<string>;
  readonly name: FormControl<string>;
  readonly description: FormControl<string>;
  readonly color: FormControl<string>;
  readonly active: FormControl<boolean>;
}

@Component({
  selector: 'app-label-form',
  imports: [ReactiveFormsModule],
  templateUrl: './label-form.html',
  styleUrl: './label-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelFormComponent implements OnChanges {
  readonly tag = input<Tag | null>(null);
  readonly saving = input(false);
  readonly validationErrors = input<readonly string[]>([]);
  readonly submitForm = output<TagFormValue>();
  readonly cancel = output<void>();
  readonly presetColors = ['#3B82F6', '#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444'];

  readonly form = new FormGroup<LabelFormControls>({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    color: new FormControl('', { nonNullable: true }),
    active: new FormControl(true, { nonNullable: true }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tag']) {
      const tag = this.tag();
      this.form.setValue({
        code: tag?.code ?? '',
        name: tag?.name ?? '',
        description: tag?.description ?? '',
        color: tag?.color ?? '',
        active: tag?.active ?? true,
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

  protected previewColor(): string {
    return resolveSafeTagColor(this.form.controls.color.value || DEFAULT_TAG_COLOR);
  }

  protected selectColor(color: string): void {
    this.form.controls.color.setValue(color);
  }
}
