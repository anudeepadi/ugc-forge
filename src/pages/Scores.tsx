import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";

export function Scores() {
  const navigate = useNavigate();
  const { scripts, activeCampaign } = useApp();

  // Same values the API returns and the CSV exports; no separate score source.
  const scored = scripts.filter((s) => s.viral_score !== null);
  const average =
    scored.length > 0
      ? scored.reduce((sum, s) => sum + (s.viral_score ?? 0), 0) / scored.length
      : null;

  return (
    <div>
      <SectionHeader
        eyebrow="Sample Scores"
        title="Illustrative score values."
        description="These are fixed sample values that show where a scoring step would sit in the workflow. They are not predictions of ad performance and do not rank scripts on merit. Review the scripts themselves before anything moves to production."
        action={
          scripts.length > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/scripts")}
            >
              Review scripts →
            </Button>
          ) : undefined
        }
      />

      {scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BarChart3 className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-white text-xl font-medium mb-2">No scores yet</h3>
          <p className="text-white/50 text-sm max-w-sm mb-6">
            Plan a campaign in the factory, or load the sample campaign from
            Command, to see the sample value attached to each script.
          </p>
          <Button variant="primary" onClick={() => navigate("/factory")}>
            Go to factory
          </Button>
        </div>
      ) : (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-light">
            <div className="flex items-center gap-3">
              <Badge variant="default">Illustrative</Badge>
              <span className="text-sm text-black/70">
                {activeCampaign?.product_name}
              </span>
            </div>
            <span className="text-sm text-black/70">
              Average sample value:{" "}
              <span className="font-mono text-black">
                {average !== null ? average.toFixed(1) : "—"}
              </span>
            </span>
          </div>
          <ol className="divide-y divide-gray-light">
            {scripts.map((script, i) => (
              <li key={script.id} className="flex items-start gap-4 py-3">
                <span className="text-label text-gray-mid pt-0.5 w-16 flex-shrink-0">
                  Script {String(i + 1).padStart(2, "0")}
                </span>
                <p className="flex-1 min-w-0 text-sm text-black">
                  {script.hook}
                </p>
                <span className="font-mono text-sm text-black flex-shrink-0">
                  {script.viral_score !== null
                    ? script.viral_score.toFixed(1)
                    : "—"}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
