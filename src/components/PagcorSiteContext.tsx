'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type PagcorSite = 'filbet' | 'filplay' | 'all';
export type PagcorDataSite = 'filbet' | 'filplay';

export const pagcorSiteLabels: Record<PagcorSite, string> = {
  filbet: 'Filbet', filplay: 'Filplay', all: '总合',
};

const PagcorSiteContext = createContext<{ site: PagcorSite; setSite: (site: PagcorSite) => void } | null>(null);

export function PagcorSiteProvider({ children }: { children: React.ReactNode }) {
  const [site, updateSite] = useState<PagcorSite>('filbet');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pagcor-admin-site');
      if (saved === 'filbet' || saved === 'filplay' || saved === 'all') updateSite(saved);
    } catch { /* Storage may be unavailable. */ }
  }, []);

  const setSite = useCallback((nextSite: PagcorSite) => {
    updateSite(nextSite);
    try {
      localStorage.setItem('pagcor-admin-site', nextSite);
    } catch { /* Keep the in-memory selection when storage is unavailable. */ }
  }, []);

  const value = useMemo(() => ({ site, setSite }), [site, setSite]);
  return <PagcorSiteContext.Provider value={value}>{children}</PagcorSiteContext.Provider>;
}

export function usePagcorSite(): { site: PagcorSite; setSite: (site: PagcorSite) => void } {
  const context = useContext(PagcorSiteContext);
  if (!context) throw new Error('usePagcorSite must be used within PagcorSiteProvider');
  return context;
}
