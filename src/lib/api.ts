import { demoApi, initializeDemoData } from './demo-api';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

if (DEMO_MODE) {
  initializeDemoData();
}

export interface ApiCampaign {
  id: string;
  product_name: string;
  product_url: string;
  product_description: string;
  niche: string;
  target_audience: string;
  claims_and_proof: string;
  script_tone: string;
  voice_style: string;
  status: string;
  created_at: string;
}

export interface ApiScript {
  id: string;
  campaign_id: string;
  hook: string;
  body: string;
  cta: string;
  status: string;
  viral_score: number | null;
  created_at: string;
}

export interface ApiRender {
  id: string;
  campaign_id: string;
  script_id: string;
  avatar: string;
  voice: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  progress: number;
  video_url: string | null;
  video_url_portrait: string | null;
  video_url_square: string | null;
  video_url_landscape: string | null;
  duration_seconds: number | null;
  error_message: string | null;
  created_at: string;
}

export interface ApiStats {
  campaigns: number;
  scripts: number;
  renders: number;
  avg_score: number;
}

export interface CreateCampaignPayload {
  product_name: string;
  product_url: string;
  product_description: string;
  niche: string;
  target_audience: string;
  claims_and_proof: string;
  script_tone: string;
  voice_style: string;
}

let apiUnavailable = false;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (DEMO_MODE || apiUnavailable) {
    throw new Error('API_UNAVAILABLE');
  }
  
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof TypeError) {
      apiUnavailable = true;
      initializeDemoData();
      throw new Error('API_UNAVAILABLE');
    }
    throw error;
  }
}

export const api = {
  createCampaign: async (payload: CreateCampaignPayload): Promise<ApiCampaign> => {
    try {
      return await request<ApiCampaign>('/campaigns', { method: 'POST', body: JSON.stringify(payload) });
    } catch (error) {
      if ((error as Error).message === 'API_UNAVAILABLE') {
        return demoApi.createCampaign(payload);
      }
      throw error;
    }
  },

  listCampaigns: async (): Promise<ApiCampaign[]> => {
    try {
      return await request<ApiCampaign[]>('/campaigns');
    } catch (error) {
      if ((error as Error).message === 'API_UNAVAILABLE') {
        return demoApi.listCampaigns();
      }
      throw error;
    }
  },

  getStats: async (): Promise<ApiStats> => {
    try {
      return await request<ApiStats>('/campaigns/stats');
    } catch (error) {
      if ((error as Error).message === 'API_UNAVAILABLE') {
        return demoApi.getStats();
      }
      throw error;
    }
  },

  getScripts: async (campaignId: string): Promise<ApiScript[]> => {
    try {
      return await request<ApiScript[]>(`/campaigns/${campaignId}/scripts`);
    } catch (error) {
      if ((error as Error).message === 'API_UNAVAILABLE') {
        return demoApi.getScripts(campaignId);
      }
      throw error;
    }
  },

  getRenders: async (campaignId: string): Promise<ApiRender[]> => {
    try {
      return await request<ApiRender[]>(`/campaigns/${campaignId}/renders`);
    } catch (error) {
      if ((error as Error).message === 'API_UNAVAILABLE') {
        return demoApi.getRenders(campaignId);
      }
      throw error;
    }
  },

  getExportUrl: (campaignId: string): string => {
    if (DEMO_MODE || apiUnavailable) {
      return demoApi.getExportUrl(campaignId);
    }
    return `${BASE}/campaigns/${campaignId}/export`;
  },

  watchRender: (
    renderId: string,
    onUpdate: (data: {
      status: string;
      progress: number;
      video_url: string | null;
      error_message: string | null;
    }) => void,
  ): (() => void) => {
    if (DEMO_MODE || apiUnavailable) {
      return demoApi.watchRender(renderId, onUpdate);
    }
    
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/${renderId}`);
    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data as string);
      onUpdate(data);
    };
    return () => ws.close();
  },
};
