import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  FileText,
  Film,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Hero } from "@/components/editorial/Hero";
import { StatCard } from "@/components/editorial/StatCard";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import { containerVariants } from "@/lib/animations";

export function Command() {
  const navigate = useNavigate();
  const { activeCampaign, stats, loadDemo, isGenerating } = useApp();
  const [loadStatus, setLoadStatus] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function handleLoadSample() {
    setLoadError(null);
    setLoadStatus("Opening sample campaign…");
    try {
      await loadDemo();
      setLoadStatus("Sample campaign open. Review its scripts next.");
    } catch {
      setLoadStatus(null);
      setLoadError(
        "The sample campaign could not be opened. Check that the backend is running and migrated, then try again.",
      );
    }
  }

  return (
    <div>
      <Hero
        eyebrow="Campaign Planning"
        headline="Plan UGC campaigns and review scripts."
        description="Turn one product brief into a campaign with six script variants to review and a sample render queue. The browser demo uses sample data; it does not generate video or call model, voice, or avatar providers."
        cta={{
          label: "Plan a campaign",
          onClick: () => navigate("/factory"),
          icon: <ArrowRight className="w-5 h-5" />,
        }}
        secondaryCta={{
          label: "Load sample campaign",
          onClick: () => {
            if (!isGenerating) void handleLoadSample();
          },
          icon: <Zap className="w-4 h-4" />,
        }}
      />

      <p role="status" className="mt-4 text-sm text-white/70 min-h-[1.25rem]">
        {loadStatus}
      </p>
      {loadError && (
        <p role="alert" className="mt-2 text-sm text-red-light">
          {loadError}
        </p>
      )}

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          value={stats.campaigns}
          label="Campaigns"
          sublabel="Niche-specific workspaces"
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          value={stats.scripts}
          label="Scripts"
          sublabel="Hooks, bodies, CTAs"
        />
        <StatCard
          icon={<Film className="w-5 h-5" />}
          value={stats.renders}
          label="Render jobs"
          sublabel="Sample queue entries"
        />
      </motion.div>

      {/* Campaign + Queue panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-10">
        <div className="lg:col-span-3">
          <SectionHeader title="Current campaign" className="mb-6" />
          {activeCampaign ? (
            <Card className="p-8">
              <p className="text-label text-gray-mid mb-3">Current product</p>
              <h3 className="text-2xl font-semibold text-black mb-2">
                {activeCampaign.product_name}
              </h3>
              <p className="text-gray-mid text-sm leading-relaxed mb-6 line-clamp-2">
                {activeCampaign.product_description}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/scripts")}
                >
                  Review scripts
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/renders")}
                >
                  Sample render queue
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-12 flex flex-col items-center text-center">
              <TrendingUp className="w-10 h-10 text-gray-light mb-4" />
              <p className="font-medium text-black mb-1">No campaign yet</p>
              <p className="text-sm text-gray-mid max-w-xs">
                Use the factory to plan a campaign from a product brief, or load
                the sample campaign.
              </p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <SectionHeader title="Sample render queue" className="mb-6" />
          <Card className="p-8 min-h-[160px] flex flex-col items-center justify-center text-center">
            <Film className="w-8 h-8 text-gray-light mb-3" />
            <p className="text-sm text-gray-mid">
              {stats.renders > 0
                ? `${stats.renders} sample jobs · no video output`
                : "Render jobs appear after campaign creation."}
            </p>
            {stats.renders > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-black"
                onClick={() => navigate("/renders")}
              >
                View sample queue →
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
