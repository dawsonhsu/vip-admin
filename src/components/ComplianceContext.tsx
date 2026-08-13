'use client';

import React, { createContext, useContext, useState } from 'react';
import { defaultComplianceConfig, type ComplianceConfig } from '@/data/clientConfigData';

interface ComplianceContextValue {
  config: ComplianceConfig;
  setConfig: React.Dispatch<React.SetStateAction<ComplianceConfig>>;
}

const ComplianceContext = createContext<ComplianceContextValue | null>(null);

export function ComplianceProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ComplianceConfig>(defaultComplianceConfig);
  return (
    <ComplianceContext.Provider value={{ config, setConfig }}>
      {children}
    </ComplianceContext.Provider>
  );
}

export function useCompliance(): ComplianceContextValue {
  const ctx = useContext(ComplianceContext);
  if (!ctx) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return ctx;
}
