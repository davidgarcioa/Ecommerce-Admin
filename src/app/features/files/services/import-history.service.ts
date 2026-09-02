import { Injectable, signal } from '@angular/core';

import { FILE_IMPORT_HISTORY_KEY } from '../constants/files.constants';
import { ImportHistoryRecord } from '../models/import-history-record.model';

const HISTORY_RETENTION_DAYS = 365;
const HISTORY_RETENTION_MS = HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const HISTORY_LIMIT = 100;

@Injectable({ providedIn: 'root' })
export class ImportHistoryService {
  private readonly historyState = signal<readonly ImportHistoryRecord[]>(this.readHistory());

  readonly history = this.historyState.asReadonly();

  constructor() {
    this.persist();
  }

  addRecord(record: ImportHistoryRecord): void {
    this.historyState.update((history) => this.normalizeHistory([record, ...history]));
    this.persist();
  }

  hasImportedFileChecksum(checksum: string): boolean {
    const normalizedChecksum = checksum.trim().toLowerCase();

    if (!normalizedChecksum) {
      return false;
    }

    return this.historyState().some(
      (record) => record.fileChecksum?.trim().toLowerCase() === normalizedChecksum,
    );
  }

  deleteRecord(id: string): void {
    this.historyState.update((history) => history.filter((record) => record.id !== id));
    this.persist();
  }

  private readHistory(): readonly ImportHistoryRecord[] {
    try {
      const raw = localStorage.getItem(FILE_IMPORT_HISTORY_KEY);
      if (!raw) {
        return [];
      }
      return this.normalizeHistory(JSON.parse(raw) as readonly ImportHistoryRecord[]);
    } catch {
      return [];
    }
  }

  private normalizeHistory(
    records: readonly ImportHistoryRecord[],
  ): readonly ImportHistoryRecord[] {
    const retentionStart = Date.now() - HISTORY_RETENTION_MS;

    return records
      .filter((record) => {
        const createdAtTime = new Date(record.createdAt).getTime();
        return Number.isFinite(createdAtTime) && createdAtTime >= retentionStart;
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      )
      .slice(0, HISTORY_LIMIT);
  }

  private persist(): void {
    try {
      localStorage.setItem(FILE_IMPORT_HISTORY_KEY, JSON.stringify(this.historyState()));
    } catch {
      return;
    }
  }
}
