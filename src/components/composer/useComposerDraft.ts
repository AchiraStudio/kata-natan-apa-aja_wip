import { useState, useEffect, useCallback } from 'react';

const DRAFT_STORAGE_KEY = 'titik_composer_draft_v1';

export interface ComposerDraft {
  caption: string;
  locationTag: string;
  relatedReportId?: string;
  relatedFacilityId?: string;
}

const DEFAULT_DRAFT: ComposerDraft = {
  caption: '',
  locationTag: 'Kota Bogor',
};

export function useComposerDraft() {
  const [draft, setDraftState] = useState<ComposerDraft>(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_DRAFT, ...JSON.parse(saved) };
      }
    } catch {
      // ignore parsing error
    }
    return DEFAULT_DRAFT;
  });

  const updateDraft = useCallback((updates: Partial<ComposerDraft>) => {
    setDraftState((prev) => {
      const next = { ...prev, ...updates };
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // quota exceeded or storage disabled
      }
      return next;
    });
  }, []);

  const clearDraft = useCallback(() => {
    setDraftState(DEFAULT_DRAFT);
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const isDirty = draft.caption.trim().length > 0;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    draft,
    updateDraft,
    clearDraft,
    isDirty,
  };
}
