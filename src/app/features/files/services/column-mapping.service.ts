import { Injectable } from '@angular/core';

import { ColumnMapping } from '../models/column-mapping.model';
import { ImportColumnDefinition } from '../models/import-column.model';
import { normalizeColumnKey } from '../utils/validation.utils';

@Injectable({ providedIn: 'root' })
export class ColumnMappingService {
  generateMappings(
    definitions: readonly ImportColumnDefinition[],
    sourceHeaders: readonly string[],
  ): readonly ColumnMapping[] {
    const usedHeaders = new Set<string>();

    return definitions.map((definition) => {
      const labelKey = normalizeColumnKey(definition.label);
      const aliases = definition.acceptedAliases.map(normalizeColumnKey);
      const labelMatch = sourceHeaders.find((header) => {
        const normalized = normalizeColumnKey(header);
        return normalized === labelKey && !usedHeaders.has(normalized);
      });
      const exactMatch = sourceHeaders.find((header) => {
        const normalized = normalizeColumnKey(header);
        return aliases.includes(normalized) && !usedHeaders.has(normalized);
      });
      const match =
        labelMatch ??
        exactMatch ??
        sourceHeaders.find((header) => {
          const normalized = normalizeColumnKey(header);
          return (
            this.matchesColumn(normalized, [labelKey, ...aliases]) && !usedHeaders.has(normalized)
          );
        });

      if (!match) {
        return {
          systemColumnKey: definition.key,
          confidence: 0,
          manuallySelected: false,
          status: definition.required ? 'unmapped' : 'unmapped',
        };
      }

      usedHeaders.add(normalizeColumnKey(match));
      return {
        systemColumnKey: definition.key,
        sourceColumnName: match,
        confidence: 92,
        manuallySelected: false,
        status: 'suggested',
      };
    });
  }

  private matchesColumn(normalizedHeader: string, aliases: readonly string[]): boolean {
    return aliases.some(
      (alias) =>
        normalizedHeader === alias ||
        normalizedHeader.includes(alias) ||
        alias.includes(normalizedHeader),
    );
  }

  updateMapping(
    mappings: readonly ColumnMapping[],
    nextMapping: ColumnMapping,
  ): readonly ColumnMapping[] {
    const duplicated = mappings.some(
      (mapping) =>
        mapping.systemColumnKey !== nextMapping.systemColumnKey &&
        mapping.sourceColumnName === nextMapping.sourceColumnName &&
        Boolean(nextMapping.sourceColumnName),
    );

    return mappings.map((mapping) =>
      mapping.systemColumnKey === nextMapping.systemColumnKey
        ? {
            ...nextMapping,
            manuallySelected: true,
            status: duplicated ? 'conflict' : nextMapping.sourceColumnName ? 'mapped' : 'unmapped',
          }
        : mapping,
    );
  }
}
