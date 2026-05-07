import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  FileText,
  Film,
  Star,
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
  const { activeCampaign, stats, loadDemo } = useApp();

  return (
    <div>
      <Hero
        eyebrow="Creative Operations"
        headline="Generate, score, and export UGC variants."
        description="Turn one product brief into a batch of UGC ad variants ready for testing."
        cta={{
          label: "Build a campaign",
          onClick: () => navigate("/factory"),
          icon: <ArrowRight className="w-5 h-5" />,
        }}
        secondaryCta={{
          label: "Load demo",
          onClick: loadDemo,
          icon: <Zap className="w-4 h-4" />,
        }}
      />

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-12"
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
          label="Ready renders"
          sublabel={`${stats.renders} total jobs`}
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          value={stats.avgScore > 0 ? stats.avgScore.toFixed(1) : "—"}
          label="Avg viral score"
          sublabel="Mock scoring model"
        />
      </motion.div>

      {/* Campaign + Queue panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-10">
        <div className="lg:col-span-3">
          <SectionHeader title="Active campaign" className="mb-6" />
          {activeCampaign ? (
            <Card className="p-8">
              <p className="text-label text-gray-mid mb-3">Current product</p>
              <h3 className="text-2xl font-semibold text-black mb-2">
                {activeCampaign.product_name}
              </h3>
              <p className="text-gray-mid text-sm leading-relaxed mb-6 line-clamp-2">
                {activeCampaign.product_description}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/scripts")}
                >
                  View scripts
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/renders")}
                >
                  View renders
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-12 flex flex-col items-center text-center">
              <TrendingUp className="w-10 h-10 text-gray-light mb-4" />
              <p className="font-medium text-black mb-1">No campaign yet</p>
              <p className="text-sm text-gray-mid max-w-xs">
                Use the factory to create a product-specific content engine, or
                load the demo campaign.
              </p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <SectionHeader title="Latest render queue" className="mb-6" />
          <Card className="p-8 min-h-[160px] flex flex-col items-center justify-center text-center">
            <Film className="w-8 h-8 text-gray-light mb-3" />
            <p className="text-sm text-gray-mid">
              {stats.renders > 0
                ? `${stats.renders} jobs queued`
                : "Render jobs appear after campaign creation."}
            </p>
            {stats.renders > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-black"
                onClick={() => navigate("/renders")}
              >
                View all renders →
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
