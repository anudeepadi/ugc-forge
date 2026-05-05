export interface Campaign {
  id: string;
  productName: string;
  productUrl: string;
  productDescription: string;
  niche: string;
  targetAudience: string;
  claimsAndProof: string;
  scriptTone: string;
  voiceStyle: string;
  createdAt: string;
  status: 'draft' | 'generating' | 'ready';
}

export interface Script {
  id: string;
  campaignId: string;
  hook: string;
  body: string;
  cta: string;
  status: 'draft' | 'tested' | 'approved';
  createdAt: string;
}

export interface Render {
  id: string;
  scriptId: string;
  campaignId: string;
  avatar: string;
  voice: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  progress: number;
  createdAt: string;
}

export interface PipelineService {
  name: string;
  status: 'online' | 'offline' | 'warning';
  description: string;
}

export interface AppStats {
  campaigns: number;
  scripts: number;
  renders: number;
  avgScore: number;
}
