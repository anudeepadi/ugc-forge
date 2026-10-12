import type { Campaign, Script, Render, PipelineService, AppStats } from './types';

export const PIPELINE_SERVICES: PipelineService[] = [
  { name: 'Script model', status: 'example', description: 'Example stage · demo uses sample templates' },
  { name: 'Voice', status: 'example', description: 'Example stage · not connected in demo' },
  { name: 'Avatar', status: 'example', description: 'Example stage · not connected in demo' },
  { name: 'Video render', status: 'example', description: 'Example stage · no video is produced' },
];

export const EMPTY_STATS: AppStats = {
  campaigns: 0,
  scripts: 0,
  renders: 0,
  avgScore: 0,
};

const HOOKS = [
  "What do you look for in a daily serum?",
  "A closer look at this fictional vitamin C formula.",
  "Read the ingredients before choosing your next serum.",
  "A sample routine, built around a simple brief.",
  "Fragrance-free is one detail to check.",
  "Three things to ask before trying a new serum."
];

const BODIES = [
  "This fictional brief describes stable vitamin C, niacinamide and a fragrance-free formula. The sample script repeats those supplied details; it is not a personal testimonial or evidence of results.",
  "The audience wants ingredient clarity and a lightweight routine. Review the full ingredient list and instructions before deciding whether a real product would fit.",
  "No clinical study, price comparison or customer result was supplied. A publishable script would need verified evidence for any performance claim."
];

const CTAS = [
  "Read the ingredients and instructions.",
  "Explore the product details before deciding.",
  "See whether it fits your daily routine."
];

// Illustrative sample scores, not predictions. Mirrors _SCORES in backend/app/providers/script/stub.py.
export const SAMPLE_SCORES = [9.1, 8.7, 8.4, 8.1, 7.9, 7.3];

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
    'Fictional supplied attributes: stable vitamin C, niacinamide, fragrance-free. No clinical evidence, customer results, refund offer or comparative price was supplied.',
  scriptTone: 'casual-founder',
  voiceStyle: 'warm-authentic',
};
