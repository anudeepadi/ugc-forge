import type { ApiCampaign, ApiScript, ApiRender, ApiStats, CreateCampaignPayload } from './api';
import { buildMockCampaign, buildMockScripts, buildMockRenders, DEMO_CAMPAIGN_DATA } from './mock-data';

let demoData: {
  campaigns: ApiCampaign[];
  scripts: Map<string, ApiScript[]>;
  renders: Map<string, ApiRender[]>;
} = {
  campaigns: [],
  scripts: new Map(),
  renders: new Map(),
};

function toApiCampaign(campaign: ReturnType<typeof buildMockCampaign>): ApiCampaign {
  return {
    id: campaign.id,
    product_name: campaign.productName,
    product_url: campaign.productUrl,
    product_description: campaign.productDescription,
    niche: campaign.niche,
    target_audience: campaign.targetAudience,
    claims_and_proof: campaign.claimsAndProof,
    script_tone: campaign.scriptTone,
    voice_style: campaign.voiceStyle,
    status: campaign.status,
    created_at: campaign.createdAt,
  };
}

function toApiScript(script: ReturnType<typeof buildMockScripts>[0]): ApiScript {
  return {
    id: script.id,
    campaign_id: script.campaignId,
    hook: script.hook,
    body: script.body,
    cta: script.cta,
    status: script.status,
    viral_score: Math.floor(Math.random() * 30) + 70,
    created_at: script.createdAt,
  };
}

function toApiRender(render: ReturnType<typeof buildMockRenders>[0]): ApiRender {
  return {
    id: render.id,
    campaign_id: render.campaignId,
    script_id: render.scriptId,
    avatar: render.avatar,
    voice: render.voice,
    status: render.status,
    progress: render.progress,
    video_url: render.status === 'complete' ? `https://example.com/video/${render.id}.mp4` : null,
    video_url_portrait: null,
    video_url_square: null,
    video_url_landscape: null,
    duration_seconds: render.status === 'complete' ? 45 : null,
    error_message: null,
    created_at: render.createdAt,
  };
}

export const demoApi = {
  createCampaign: async (payload: CreateCampaignPayload): Promise<ApiCampaign> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockCampaign = buildMockCampaign({
      productName: payload.product_name,
      productUrl: payload.product_url,
      productDescription: payload.product_description,
      niche: payload.niche,
      targetAudience: payload.target_audience,
      claimsAndProof: payload.claims_and_proof,
      scriptTone: payload.script_tone,
      voiceStyle: payload.voice_style,
    });
    
    const apiCampaign = toApiCampaign(mockCampaign);
    demoData.campaigns.unshift(apiCampaign);
    
    const mockScripts = buildMockScripts(apiCampaign.id);
    const apiScripts = mockScripts.map(toApiScript);
    demoData.scripts.set(apiCampaign.id, apiScripts);
    
    const mockRenders = buildMockRenders(mockScripts);
    const apiRenders = mockRenders.map(toApiRender);
    demoData.renders.set(apiCampaign.id, apiRenders);
    
    return apiCampaign;
  },

  listCampaigns: async (): Promise<ApiCampaign[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return demoData.campaigns;
  },

  getStats: async (): Promise<ApiStats> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    let totalScripts = 0;
    let totalRenders = 0;
    let totalScore = 0;
    let scriptCount = 0;
    
    demoData.scripts.forEach(scripts => {
      totalScripts += scripts.length;
      scripts.forEach(s => {
        if (s.viral_score) {
          totalScore += s.viral_score;
          scriptCount++;
        }
      });
    });
    
    demoData.renders.forEach(renders => {
      totalRenders += renders.length;
    });
    
    return {
      campaigns: demoData.campaigns.length,
      scripts: totalScripts,
      renders: totalRenders,
      avg_score: scriptCount > 0 ? totalScore / scriptCount : 0,
    };
  },

  getScripts: async (campaignId: string): Promise<ApiScript[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return demoData.scripts.get(campaignId) || [];
  },

  getRenders: async (campaignId: string): Promise<ApiRender[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return demoData.renders.get(campaignId) || [];
  },

  getExportUrl: (campaignId: string): string => {
    return `#export-${campaignId}`;
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
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        onUpdate({
          status: 'complete',
          progress: 100,
          video_url: `https://example.com/video/${renderId}.mp4`,
          error_message: null,
        });
        clearInterval(interval);
      } else {
        onUpdate({
          status: 'processing',
          progress,
          video_url: null,
          error_message: null,
        });
      }
    }, 500);
    
    return () => clearInterval(interval);
  },
};

export function initializeDemoData(): void {
  if (demoData.campaigns.length === 0) {
    const mockCampaign = buildMockCampaign(DEMO_CAMPAIGN_DATA);
    const apiCampaign = toApiCampaign(mockCampaign);
    demoData.campaigns.push(apiCampaign);
    
    const mockScripts = buildMockScripts(apiCampaign.id);
    const apiScripts = mockScripts.map(toApiScript);
    demoData.scripts.set(apiCampaign.id, apiScripts);
    
    const mockRenders = buildMockRenders(mockScripts);
    const apiRenders = mockRenders.map(toApiRender);
    demoData.renders.set(apiCampaign.id, apiRenders);
  }
}
