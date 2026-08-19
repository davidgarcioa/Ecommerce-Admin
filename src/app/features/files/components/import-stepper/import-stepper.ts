import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ImportStep, ImportStepId } from '../../models/import-process.model';

@Component({
  selector: 'app-import-stepper',
  templateUrl: './import-stepper.html',
  styleUrl: './import-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportStepperComponent {
  readonly steps = input.required<readonly ImportStep[]>();
  readonly currentStep = input.required<ImportStepId>();
  readonly stepClick = output<ImportStepId>();

  getStepState(step: ImportStep): 'active' | 'completed' | 'pending' {
    const currentIndex = this.steps().findIndex((item) => item.id === this.currentStep());
    const stepIndex = this.steps().findIndex((item) => item.id === step.id);
    if (stepIndex === currentIndex) {
      return 'active';
    }
    return stepIndex < currentIndex ? 'completed' : 'pending';
  }
}
