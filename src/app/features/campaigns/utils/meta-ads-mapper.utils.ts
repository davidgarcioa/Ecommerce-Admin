import { CampaignObjective, CampaignStatus } from '../models/campaign.model';

export function normalizeMetaStatus(status: string | undefined): CampaignStatus {
  switch (status) {
    case 'ACTIVE':
      return 'Activa';
    case 'PAUSED':
      return 'Pausada';
    case 'ARCHIVED':
      return 'Archivada';
    case 'DELETED':
      return 'Finalizada';
    case 'IN_PROCESS':
    case 'WITH_ISSUES':
      return 'Con errores';
    default:
      return 'En revisión';
  }
}

export function normalizeMetaObjective(objective: string | undefined): CampaignObjective {
  switch (objective) {
    case 'OUTCOME_SALES':
    case 'CONVERSIONS':
      return 'Ventas';
    case 'LINK_CLICKS':
    case 'OUTCOME_TRAFFIC':
      return 'Tráfico';
    case 'LEAD_GENERATION':
      return 'Clientes potenciales';
    case 'OUTCOME_ENGAGEMENT':
      return 'Interacción';
    default:
      return 'Reconocimiento';
  }
}
