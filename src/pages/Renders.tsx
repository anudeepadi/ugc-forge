import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clapperboard, Clock, CheckCircle2, Download } from "lucide-react";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { ContentGrid } from "@/components/editorial/ContentGrid";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";
import { itemVariants } from "@/lib/animations";

const STATUS_BADGE: Record<
  string,
  "default" | "success" | "warning" | "error"
> = {
  queued: "default",
  processing: "warning",
  complete: "success",
  failed: "error",
};

export function Renders() {
  const navigate = useNavigate();
  const { renders, scripts, activeCampaign } = useApp();

  function getScript(scriptId: string) {
    return scripts.find((s) => s.id === scriptId);
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Render Bay"
        title="A production queue that looks like a creative department."
        description="The queue models the handoff from scripts to TTS, talking head, B-roll, captions, audio ducking, and export packaging."
        action={
          renders.length > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/exports")}
            >
              Export all →
            </Button>
          ) : undefined
        }
      />

      {activeCampaign && renders.length > 0 && (
        <div className="mb-8 px-4 py-3 border border-white/10 bg-white/5 flex items-center gap-3">
          <Badge variant="warning">Queued</Badge>
          <span className="text-white/70 text-sm">
            {renders.length} render jobs · {activeCampaign.product_name}
          </span>
        </div>
      )}

      {renders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Clapperboard className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-white text-xl font-medium mb-2">
            Render bay is empty
          </h3>
          <p className="text-white/50 text-sm max-w-sm mb-6">
            Generate a campaign to create mock video jobs that can later be
            connected to LivePortrait, XTTS, and FFmpeg.
          </p>
          <Button variant="primary" onClick={() => navigate("/factory")}>
            Go to factory
          </Button>
        </div>
      ) : (
        <ContentGrid columns={3} gap="md">
          {renders.map((render) => {
            const script = getScript(render.script_id);
            return (
              <motion.div key={render.id} variants={itemVariants}>
                <Card hover className="p-6 h-full flex flex-col">
                  {/* Thumbnail placeholder */}
                  <div className="w-full aspect-video bg-gray-light mb-4 flex items-center justify-center">
                    {render.status === "queued" && (
                      <Clock className="w-8 h-8 text-gray-mid" />
                    )}
                    {render.status === "complete" && (
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    )}
                    {render.status === "processing" && (
                      <div className="w-8 h-8 border-2 border-warning border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-black font-semibold text-sm truncate max-w-[140px]">
                        {script?.hook ?? render.script_id}
                      </p>
                      <p className="text-gray-mid text-xs mt-0.5">
                        {render.avatar} · Voice: {render.voice}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE[render.status]}>
                      {render.status}
                    </Badge>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-light">
                    {render.status === "complete" ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs border-black text-black hover:bg-black/5"
                        disabled
                      >
                        Waiting…
                      </Button>
                    )}
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
