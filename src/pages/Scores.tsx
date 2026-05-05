
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';
import { SectionHeader } from '@/components/editorial/SectionHeader';
import { ContentGrid } from '@/components/editorial/ContentGrid';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { itemVariants } from '@/lib/animations';

const MOCK_SCORES = [9.1, 8.7, 8.4, 8.1, 7.9, 7.3];

export function Scores() {
  const navigate = useNavigate();
  const { scripts, activeCampaign } = useApp();

  const scored = scripts.map((s, i) => ({ ...s, score: MOCK_SCORES[i % MOCK_SCORES.length] }));
  const sorted = [...scored].sort((a, b) => b.score - a.score);

  return (
    <div>
      <SectionHeader
        eyebrow="Scoring Dashboard"
        title="Viral score estimates for every variant."
        description="Mock scoring model estimates scroll-stop probability, hook strength, and CTA clarity. Swap in your real scoring API when ready."
      />

      {scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Star className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-white text-xl font-medium mb-2">No scores yet</h3>
          <p className="text-white/50 text-sm max-w-sm mb-6">
            Generate a campaign to get viral score estimates for each script variant.
          </p>
          <Button variant="primary" onClick={() => navigate('/factory')}>
            Go to factory
          </Button>
        </div>
      ) : (
        <>
          {/* Top 5 leaderboard */}
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-gray-mid" />
              <h3 className="text-section-header text-lg text-black">Top performers</h3>
            </div>
            <div className="space-y-3">
              {sorted.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 py-2 border-b border-gray-light last:border-0">
                  <span className="text-display text-2xl text-gray-mid w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-black text-sm font-medium truncate">{s.hook}</p>
                    <p className="text-gray-mid text-xs mt-0.5">{activeCampaign?.productName}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="text-display text-xl text-black">{s.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* All score cards */}
          <ContentGrid columns={3} gap="md">
            {sorted.map((script) => (
              <motion.div key={script.id} variants={itemVariants}>
                <Card hover className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-label text-gray-mid">Viral score</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="text-display text-3xl text-black">{script.score}</span>
                    </div>
                  </div>
                  <p className="text-black font-semibold text-sm leading-snug mb-2">{script.hook}</p>
                  <p className="text-gray-mid text-xs line-clamp-2 flex-1">{script.body}</p>
                  <div className="mt-4 pt-3 border-t border-gray-light">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-black text-xs hover:text-black"
                      onClick={() => navigate('/scripts')}
                    >
                      View script →
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </ContentGrid>
        </>
      )}
    </div>
  );
}
