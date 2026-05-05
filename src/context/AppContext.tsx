import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Campaign, Script, Render, AppStats } from '@/lib/types';
import {
  EMPTY_STATS,
  buildMockCampaign,
  buildMockScripts,
  buildMockRenders,
  DEMO_CAMPAIGN_DATA,
} from '@/lib/mock-data';

interface AppContextType {
  activeCampaign: Campaign | null;
  scripts: Script[];
  renders: Render[];
  stats: AppStats;
  generateCampaign: (data: Partial<Campaign>) => void;
  loadDemo: () => void;
  clearCampaign: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [renders, setRenders] = useState<Render[]>([]);
  const [stats, setStats] = useState<AppStats>(EMPTY_STATS);

  const applyGeneration = useCallback((data: Partial<Campaign>) => {
    const campaign = buildMockCampaign(data);
    const newScripts = buildMockScripts(campaign.id);
    const newRenders = buildMockRenders(newScripts);
    setActiveCampaign(campaign);
    setScripts(newScripts);
    setRenders(newRenders);
    setStats({
      campaigns: 1,
      scripts: newScripts.length,
      renders: newRenders.length,
      avgScore: 7.2,
    });
  }, []);

  const generateCampaign = useCallback((data: Partial<Campaign>) => {
    applyGeneration(data);
  }, [applyGeneration]);

  const loadDemo = useCallback(() => {
    applyGeneration(DEMO_CAMPAIGN_DATA);
  }, [applyGeneration]);

  const clearCampaign = useCallback(() => {
    setActiveCampaign(null);
    setScripts([]);
    setRenders([]);
    setStats(EMPTY_STATS);
  }, []);

  return (
    <AppContext.Provider value={{ activeCampaign, scripts, renders, stats, generateCampaign, loadDemo, clearCampaign }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
