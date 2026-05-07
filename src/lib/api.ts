const BASE = 'http://localhost:8000/api/v1';

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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createCampaign: (payload: CreateCampaignPayload) =>
    request<ApiCampaign>('/campaigns', { method: 'POST', body: JSON.stringify(payload) }),

  listCampaigns: () =>
    request<ApiCampaign[]>('/campaigns'),

  getStats: () =>
    request<ApiStats>('/campaigns/stats'),

  getScripts: (campaignId: string) =>
    request<ApiScript[]>(`/campaigns/${campaignId}/scripts`),

  getRenders: (campaignId: string) =>
    request<ApiRender[]>(`/campaigns/${campaignId}/renders`),

  getExportUrl: (campaignId: string) =>
    `${BASE}/campaigns/${campaignId}/export`,

  watchRender: (
    renderId: string,
    onUpdate: (data: {
      status: string;
      progress: number;
      video_url: string | null;
      error_message: string | null;
    }) => void,
  ): (() => void) => {
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/${renderId}`);
    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data as string);
      onUpdate(data);
    };
    return () => ws.close();
  },
};
