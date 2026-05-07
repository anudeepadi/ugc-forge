import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, type ApiCampaign, type ApiScript, type ApiRender } from '@/lib/api';
import type { AppStats } from '@/lib/types';
import { EMPTY_STATS } from '@/lib/mock-data';

interface GenerateCampaignInput {
  productName: string;
  productUrl: string;
  productDescription: string;
  niche: string;
  targetAudience: string;
  claimsAndProof: string;
  scriptTone: string;
  voiceStyle: string;
}

interface AppContextType {
  activeCampaign: ApiCampaign | null;
  scripts: ApiScript[];
  renders: ApiRender[];
  stats: AppStats;
  isGenerating: boolean;
  generateCampaign: (data: GenerateCampaignInput) => Promise<void>;
  loadDemo: () => Promise<void>;
  refreshRenders: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeCampaign, setActiveCampaign] = useState<ApiCampaign | null>(null);
  const [scripts, setScripts] = useState<ApiScript[]>([]);
  const [renders, setRenders] = useState<ApiRender[]>([]);
  const [stats, setStats] = useState<AppStats>(EMPTY_STATS);
  const [isGenerating, setIsGenerating] = useState(false);

  const refreshStats = useCallback(async () => {
    try {
      const s = await api.getStats();
      setStats({ campaigns: s.campaigns, scripts: s.scripts, renders: s.renders, avgScore: s.avg_score });
    } catch {
      // backend may not be running yet
    }
  }, []);

  const loadCampaignData = useCallback(async (campaign: ApiCampaign) => {
    setActiveCampaign(campaign);
    const [fetchedScripts, fetchedRenders] = await Promise.all([
      api.getScripts(campaign.id),
      api.getRenders(campaign.id),
    ]);
    setScripts(fetchedScripts);
    setRenders(fetchedRenders);
    await refreshStats();
  }, [refreshStats]);

  const generateCampaign = useCallback(async (data: GenerateCampaignInput) => {
    setIsGenerating(true);
    try {
      const campaign = await api.createCampaign({
        product_name: data.productName,
        product_url: data.productUrl,
        product_description: data.productDescription,
        niche: data.niche,
        target_audience: data.targetAudience,
        claims_and_proof: data.claimsAndProof,
        script_tone: data.scriptTone,
        voice_style: data.voiceStyle,
      });
      await loadCampaignData(campaign);
    } finally {
      setIsGenerating(false);
    }
  }, [loadCampaignData]);

  const loadDemo = useCallback(async () => {
    setIsGenerating(true);
    try {
      const campaign = await api.createCampaign({
        product_name: 'RadiantLab Vitamin C Serum',
        product_url: 'https://example.com/radiantlab-serum',
        product_description: 'A lightweight vitamin C serum for people who want brighter-looking skin without a sticky finish.',
        niche: 'dtc-skincare',
        target_audience: 'Busy women aged 25–40 who buy skincare from TikTok',
        claims_and_proof: 'Absorbs in under 30 seconds; fragrance-free; visibly improves dullness',
        script_tone: 'casual-founder',
        voice_style: 'warm-authentic',
      });
      await loadCampaignData(campaign);
    } finally {
      setIsGenerating(false);
    }
  }, [loadCampaignData]);

  const refreshRenders = useCallback(async () => {
    if (!activeCampaign) return;
    const fetchedRenders = await api.getRenders(activeCampaign.id);
    setRenders(fetchedRenders);
  }, [activeCampaign]);

  // Restore most recent campaign on mount
  useEffect(() => {
    api.listCampaigns()
      .then(async (campaigns) => {
        if (campaigns.length > 0) {
          await loadCampaignData(campaigns[0]);
        } else {
          await refreshStats();
        }
      })
      .catch(() => refreshStats());
  }, [loadCampaignData, refreshStats]);

  return (
    <AppContext.Provider value={{
      activeCampaign,
      scripts,
      renders,
      stats,
      isGenerating,
      generateCampaign,
      loadDemo,
      refreshRenders,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
