import type { Campaign, Script, Render, PipelineService, AppStats } from './types';

export const PIPELINE_SERVICES: PipelineService[] = [
  { name: 'Script LLM', status: 'online', description: 'Prompt guard controls repetition' },
  { name: 'XTTS voice', status: 'online', description: 'Voice synthesis ready' },
  { name: 'Talking head', status: 'online', description: 'Avatar renderer active' },
  { name: 'FFmpeg render', status: 'online', description: 'FFmpeg handoff simulated' },
];

export const EMPTY_STATS: AppStats = {
  campaigns: 0,
  scripts: 0,
  renders: 0,
  avgScore: 0,
};

const HOOKS = [
  'Stop scrolling if you struggle with dull skin.',
  "Tired of serums that promise everything and deliver nothing?",
  "Here's why your skincare routine is failing you.",
  'I used to spend $200/month on skincare. Not anymore.',
  'This changed my skin in 30 days — and it\'s fragrance-free.',
  'Derms won\'t tell you this. But this serum will.',
];

const BODIES = [
  'I found this lightweight vitamin C serum that actually works. Fragrance-free, absorbs in seconds, costs half what I used to pay.',
  'Most serums are full of fillers. This one uses stable vitamin C and niacinamide — nothing else. My skin has never looked better.',
  'I was skeptical too. But after 30 days my dark spots faded and my skin looks brighter. The secret? Consistent, simple ingredients.',
];

const CTAS = [
  'Try it risk-free for 30 days.',
  'Get 20% off your first order.',
  'Join 10,000+ people who made the switch.',
];

export function buildMockCampaign(data: Partial<Campaign>): Campaign {
  return {
    id: `campaign-${Date.now()}`,
    productName: data.productName ?? '',
    productUrl: data.productUrl ?? '',
    productDescription: data.productDescription ?? '',
    niche: data.niche ?? 'dtc-skincare',
    targetAudience: data.targetAudience ?? '',
    claimsAndProof: data.claimsAndProof ?? '',
    scriptTone: data.scriptTone ?? 'casual-founder',
    voiceStyle: data.voiceStyle ?? 'warm-authentic',
    createdAt: new Date().toISOString(),
    status: 'ready',
  };
}

export function buildMockScripts(campaignId: string): Script[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `script-${campaignId}-${i + 1}`,
    campaignId,
    hook: HOOKS[i % HOOKS.length],
    body: BODIES[i % BODIES.length],
    cta: CTAS[i % CTAS.length],
    status: 'draft' as const,
    createdAt: new Date().toISOString(),
  }));
}

export function buildMockRenders(scripts: Script[]): Render[] {
  const avatars = ['Avatar A', 'Avatar B', 'Avatar C'];
  const voices = ['Warm', 'Direct', 'Energetic'];
  return scripts.map((s, i) => ({
    id: `render-${s.id}`,
    scriptId: s.id,
    campaignId: s.campaignId,
    avatar: avatars[i % avatars.length],
    voice: voices[i % voices.length],
    status: 'queued' as const,
    progress: 0,
    createdAt: new Date().toISOString(),
  }));
}

export const DEMO_CAMPAIGN_DATA: Partial<Campaign> = {
  productName: 'RadiantLab Vitamin C Serum',
  productUrl: 'https://example.com/radiantlab-serum',
  productDescription:
    'A lightweight vitamin C serum for people who want brighter-looking skin without a sticky finish. Uses stable vitamin C, niacinamide, and a fragrance-free formula.',
  niche: 'dtc-skincare',
  targetAudience:
    'Busy women aged 25–40 who buy skincare from TikTok but still want ingredient credibility',
  claimsAndProof:
    'Absorbs in under 30 seconds; visibly improves dullness; fragrance-free and sensitive-skin friendly',
  scriptTone: 'casual-founder',
  voiceStyle: 'warm-authentic',
};
