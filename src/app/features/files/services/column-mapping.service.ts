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
    const exactOwnerByHeader = this.getExactOwnerByHeader(definitions, sourceHeaders);

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
          const exactOwner = exactOwnerByHeader.get(normalized);

          if (exactOwner && exactOwner !== definition.key) {
            return false;
          }

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
        (alias.length >= 4 && normalizedHeader.includes(alias)),
    );
  }

  private getExactOwnerByHeader(
    definitions: readonly ImportColumnDefinition[],
    sourceHeaders: readonly string[],
  ): ReadonlyMap<string, string> {
    const owners = new Map<string, string>();

    for (const header of sourceHeaders) {
      const normalizedHeader = normalizeColumnKey(header);
      if (!normalizedHeader) continue;

      const owner = definitions.find((definition) => {
        const keys = [definition.label, ...definition.acceptedAliases].map(normalizeColumnKey);
        return keys.includes(normalizedHeader);
      });

      if (owner) {
        owners.set(normalizedHeader, owner.key);
      }
    }

    return owners;
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
