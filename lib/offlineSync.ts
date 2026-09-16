/**
 * LVMS Field Agent Offline Verification Storage & Sync Manager
 * Safely stores in-progress and submitted verification forms in IndexedDB / LocalStorage
 * and provides automatic sync when network connectivity is restored.
 */

import { STORAGE_KEYS } from './constants';

export interface OfflineVerificationDraft {
  id: string; // caseId
  caseType: string;
  applicantName: string;
  formData: Record<string, any>;
  geotags: {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp: string;
  };
  photos: Array<{
    type: string;
    dataUrl: string; // base64 or temporary blob
    name: string;
  }>;
  status: 'DRAFT' | 'QUEUED_FOR_SYNC' | 'SYNCED' | 'FAILED';
  savedAt: string;
  lastSyncAttempt?: string;
  error?: string;
}

const STORAGE_KEY = STORAGE_KEYS.OFFLINE_QUEUE;

export class OfflineSyncManager {
  /**
   * Get all queued verification items
   */
  static getQueue(): OfflineVerificationDraft[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read offline queue:', e);
      return [];
    }
  }

  /**
   * Save a draft or queued submission
   */
  static saveDraft(draft: OfflineVerificationDraft): void {
    if (typeof window === 'undefined') return;
    try {
      const queue = this.getQueue();
      const existingIdx = queue.findIndex((item) => item.id === draft.id);
      if (existingIdx >= 0) {
        queue[existingIdx] = { ...draft, savedAt: new Date().toISOString() };
      } else {
        queue.push({ ...draft, savedAt: new Date().toISOString() });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to save offline draft:', e);
    }
  }

  /**
   * Get a specific draft by case ID
   */
  static getDraft(caseId: string): OfflineVerificationDraft | null {
    const queue = this.getQueue();
    return queue.find((item) => item.id === caseId) || null;
  }

  /**
   * Remove an item from the queue after successful sync
   */
  static removeDraft(caseId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const queue = this.getQueue().filter((item) => item.id !== caseId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to remove synced draft:', e);
    }
  }

  /**
   * Sync all queued items when internet is detected
   */
  static async syncQueuedVerifications(
    submitApiFn: (caseId: string, payload: any) => Promise<any>
  ): Promise<{ synced: number; failed: number }> {
    const queue = this.getQueue().filter((item) => item.status === 'QUEUED_FOR_SYNC');
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        await submitApiFn(item.id, {
          profileData: item.formData,
          lat: item.geotags.lat,
          lng: item.geotags.lng,
          photos: item.photos,
        });
        this.removeDraft(item.id);
        synced++;
      } catch (err: any) {
        item.status = 'FAILED';
        item.lastSyncAttempt = new Date().toISOString();
        item.error = err?.message || 'Sync failed';
        this.saveDraft(item);
        failed++;
      }
    }

    return { synced, failed };
  }
}
