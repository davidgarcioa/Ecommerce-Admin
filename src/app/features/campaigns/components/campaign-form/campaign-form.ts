import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import {
  AD_ACCOUNTS,
  BUDGET_TYPES,
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_STATUSES,
  PRODUCT_GROUPS,
  ADVERTISING_PLATFORMS,
} from '../../constants/campaigns.constants';
import { Campaign, CampaignFormData } from '../../models/campaign.model';
import { CampaignFormMode } from '../../models/campaigns-state.model';

@Component({
  selector: 'app-campaign-form',
  templateUrl: './campaign-form.html',
  styleUrl: './campaign-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignFormComponent {
  readonly mode = input.required<CampaignFormMode>();
  readonly campaign = input<Campaign | null>(null);
  readonly close = output<void>();
  readonly save = output<CampaignFormData>();

  readonly accounts = AD_ACCOUNTS;
  readonly objectives = CAMPAIGN_OBJECTIVES;
  readonly statuses = CAMPAIGN_STATUSES;
  readonly groups = PRODUCT_GROUPS.filter((group) => group.id !== 'all');
  readonly platforms = ADVERTISING_PLATFORMS;
  readonly budgetTypes = BUDGET_TYPES;

  readonly form = signal<CampaignFormData>({
    name: '',
    objective: 'Ventas',
    adAccountId: AD_ACCOUNTS[0].id,
    status: 'Activa',
    productGroupId: 'helvor-2',
    platform: 'Facebook',
    budgetType: 'Diario',
    dailyBudget: 90000,
    lifetimeBudget: null,
    startDate: '2026-07-29',
    endDate: null,
  });

  readonly title = computed(() => {
    const mode = this.mode();
    return mode === 'edit'
      ? 'Editar campaña'
      : mode === 'duplicate'
        ? 'Duplicar campaña'
        : 'Crear campaña';
  });

  readonly invalid = computed(() => {
    const form = this.form();
    const budget = form.budgetType === 'Diario' ? form.dailyBudget : form.lifetimeBudget;
    const hasInvalidDate = form.endDate !== null && form.endDate <= form.startDate;

    return (
      form.name.trim().length < 3 ||
      form.name.trim().length > 120 ||
      budget === null ||
      budget <= 0 ||
      hasInvalidDate ||
      (form.objective === 'Ventas' && form.productGroupId.length === 0)
    );
  });

  constructor() {
    queueMicrotask(() => {
      const campaign = this.campaign();
      if (!campaign) {
        return;
      }

      this.form.set({
        name: this.mode() === 'duplicate' ? `${campaign.name} copia` : campaign.name,
        objective: campaign.objective,
        adAccountId: campaign.adAccountId,
        status: campaign.status,
        productGroupId: campaign.productGroupId,
        platform: campaign.platform,
        budgetType: campaign.budgetType,
        dailyBudget: campaign.dailyBudget ?? null,
        lifetimeBudget: campaign.lifetimeBudget ?? null,
        startDate: campaign.startDate.slice(0, 10),
        endDate: campaign.endDate?.slice(0, 10) ?? null,
      });
    });
  }

  onTextChange(key: 'name' | 'startDate' | 'endDate', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.update((form) => ({
      ...form,
      [key]: value.length === 0 && key === 'endDate' ? null : value,
    }));
  }

  onSelectChange(key: keyof CampaignFormData, event: Event): void {
    this.form.update((form) => ({ ...form, [key]: (event.target as HTMLSelectElement).value }));
  }

  onBudgetChange(key: 'dailyBudget' | 'lifetimeBudget', event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.form.update((form) => ({ ...form, [key]: Number.isFinite(value) ? value : null }));
  }

  onSubmit(): void {
    if (!this.invalid()) {
      this.save.emit(this.form());
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }
}
