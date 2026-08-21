import {
  CreateTestingRequest,
  EcommerceTest,
  TestingFormValue,
  TestingListItem,
  UpdateTestingRequest,
} from './testing.models';
import {
  formatAssociationType,
  formatTestingStatus,
  formatTestingType,
  normalizeTestingCode,
  normalizeTestingText,
} from '../utils/testing.formatters';

export function toTestingListItem(item: EcommerceTest): TestingListItem {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    type: item.type,
    typeLabel: formatTestingType(item.type),
    status: item.status,
    statusLabel: formatTestingStatus(item.status),
    objective: item.objective,
    associationLabel:
      item.association.type === 'none'
        ? 'Sin asociacion'
        : `${formatAssociationType(item.association.type)} - ${item.association.label}`,
    associationType: item.association.type,
    startDate: item.startDate,
    endDate: item.endDate ?? '',
    owner: item.owner,
    updatedAt: item.updatedAt,
  };
}

export function toCreateTestingRequest(value: TestingFormValue): CreateTestingRequest {
  return toRequest(value);
}

export function toUpdateTestingRequest(value: TestingFormValue): UpdateTestingRequest {
  return toRequest(value);
}

function toRequest(value: TestingFormValue): CreateTestingRequest {
  const description = optional(value.description);
  const resultSummary = optional(value.resultSummary);
  const winner = optional(value.winner);

  return {
    code: normalizeTestingCode(value.code),
    name: normalizeTestingText(value.name),
    ...(description ? { description } : {}),
    type: value.type,
    status: value.status,
    objective: normalizeTestingText(value.objective),
    hypothesis: normalizeTestingText(value.hypothesis),
    association: {
      type: value.associationType,
      ...(optional(value.associationEntityId)
        ? { entityId: optional(value.associationEntityId) }
        : {}),
      label:
        value.associationType === 'none'
          ? 'Sin asociacion'
          : normalizeTestingText(value.associationLabel),
    },
    startDate: value.startDate,
    ...(value.endDate ? { endDate: value.endDate } : {}),
    owner: normalizeTestingText(value.owner),
    ...(resultSummary ? { resultSummary } : {}),
    ...(winner ? { winner } : {}),
  };
}

function optional(value: string): string | undefined {
  const normalized = normalizeTestingText(value);
  return normalized || undefined;
}
