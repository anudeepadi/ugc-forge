import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lightbulb, Film } from "lucide-react";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { ContentGrid } from "@/components/editorial/ContentGrid";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { itemVariants } from "@/lib/animations";

export function Scripts() {
  const navigate = useNavigate();
  const { scripts, activeCampaign } = useApp();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const isDemo = api.isDemo();

  return (
    <div>
      <SectionHeader
        eyebrow="Script Room"
        title="Review hooks, bodies, and CTAs."
        description="Each draft is formatted for short-form UGC: opening hook, creator-style body, and call to action. Review each one before it moves to production."
        action={
          scripts.length > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/renders")}
            >
              Sample render queue →
            </Button>
          ) : undefined
        }
      />

      {activeCampaign && scripts.length > 0 && (
        <div className="mb-8 px-4 py-3 border border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="default">{isDemo ? "Sample" : "Draft"}</Badge>
            <span className="text-white/70 text-sm">
              Campaign:{" "}
              <span className="text-white font-medium">
                {activeCampaign.product_name}
              </span>
              {" · "}
              {isDemo
                ? `${scripts.length} sample scripts from fixed skincare templates`
                : `${scripts.length} draft scripts`}
            </span>
          </div>
        </div>
      )}

      {scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Lightbulb className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-white text-xl font-medium mb-2">
            No scripts yet
          </h3>
          <p className="text-white/50 text-sm max-w-sm mb-6">
            Plan a campaign in the factory and its draft scripts will appear
            here for review.
          </p>
          <Button variant="primary" onClick={() => navigate("/factory")}>
            Go to factory
          </Button>
        </div>
      ) : (
        <ContentGrid columns={3} gap="md">
          {scripts.map((script, i) => {
            const isReviewing = reviewingId === script.id;
            const bodyId = `script-body-${script.id}`;
            return (
            <motion.div key={script.id} variants={itemVariants}>
              <Card hover className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-label text-gray-mid">
                    Script {String(i + 1).padStart(2, "0")}
                  </span>
                  <Badge variant="default">{script.status}</Badge>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-label text-gray-mid mb-1.5">Hook</p>
                    <p className="text-black font-semibold leading-snug">
                      {script.hook}
                    </p>
                  </div>
                  <div id={bodyId}>
                    <p className="text-label text-gray-mid mb-1.5">Body</p>
                    <p
                      className={`text-sm text-black/70 leading-relaxed ${isReviewing ? "" : "line-clamp-3"}`}
                    >
                      {script.body}
                    </p>
                    {isReviewing && activeCampaign && (
                      <div className="mt-4 p-3 bg-black/5 text-xs text-black/80 space-y-2">
                        <p className="text-label text-gray-mid">
                          Check against the brief
                        </p>
                        <p>
                          <span className="font-medium text-black">Audience: </span>
                          {activeCampaign.target_audience || "Not specified in the brief."}
                        </p>
                        <p>
                          <span className="font-medium text-black">Claims and proof: </span>
                          {activeCampaign.claims_and_proof || "Not specified in the brief."}
                        </p>
                        <p>
                          Remove any claim, number, or offer in the script that the
                          brief cannot support.
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-label text-gray-mid mb-1.5">CTA</p>
                    <p className="text-sm text-black font-medium">
                      {script.cta}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-light flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 text-xs"
                    aria-expanded={isReviewing}
                    aria-controls={bodyId}
                    onClick={() => setReviewingId(isReviewing ? null : script.id)}
                  >
                    {isReviewing ? "Collapse" : "Review"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs border-black text-black hover:bg-black/5"
                    onClick={() => navigate("/renders")}
                  >
                    <Film className="w-3 h-3" />
                    In queue
                  </Button>
                </div>
              </Card>
            </motion.div>
            );
          })}
        </ContentGrid>
      )}
    </div>
  );
}
