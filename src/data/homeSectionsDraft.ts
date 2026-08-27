import {
  cloneSections,
  type HomeSection,
  type Platform,
} from '@/data/homeSectionsData';

export const STORAGE_KEY = 'vipadmin.homeSections.draft.v1';

export interface StoredDraft {
  savedAt: string;
  sections: HomeSection[];
}

export type DraftMap = Partial<Record<Platform, StoredDraft>>;

const isQuotaExceededError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { name?: unknown; code?: unknown };
  return candidate.name === 'QuotaExceededError' || candidate.code === 22;
};

const isValidStoredDraft = (value: unknown): value is StoredDraft => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { savedAt?: unknown; sections?: unknown };
  return typeof candidate.savedAt === 'string' && Array.isArray(candidate.sections);
};

export const readAllDrafts = (): DraftMap => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    // Keep only structurally valid entries; drop anything malformed so callers
    // never hit an undefined `sections` (which would crash cloneSections).
    const result: DraftMap = {};
    for (const [platform, entry] of Object.entries(parsed as Record<string, unknown>)) {
      if (isValidStoredDraft(entry)) result[platform as Platform] = entry;
    }
    return result;
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup errors and treat the drafts as empty.
    }
    return {};
  }
};

export const readDraft = (platform: Platform): StoredDraft | null => {
  if (typeof window === 'undefined') return null;

  try {
    return readAllDrafts()[platform] ?? null;
  } catch {
    return null;
  }
};

export const writeDraft = (
  platform: Platform,
  sections: HomeSection[],
): { ok: boolean; savedAt?: string; error?: 'quota' | 'unknown' } => {
  if (typeof window === 'undefined') return { ok: false, error: 'unknown' };

  const savedAt = new Date().toISOString();
  try {
    const drafts = readAllDrafts();
    drafts[platform] = {
      savedAt,
      sections: cloneSections(sections),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    return { ok: true, savedAt };
  } catch (error: unknown) {
    return { ok: false, error: isQuotaExceededError(error) ? 'quota' : 'unknown' };
  }
};

export const clearDraft = (platform: Platform): void => {
  if (typeof window === 'undefined') return;

  try {
    const drafts = readAllDrafts();
    delete drafts[platform];
    if (Object.keys(drafts).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Storage failures are intentionally ignored when clearing a draft.
  }
};
