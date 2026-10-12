import { useNavigate } from "react-router-dom";
import { Download, Package } from "lucide-react";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";

const FORMAT_OPTIONS = [
  { value: "csv", label: "CSV (script text + render metadata)", available: true },
  { value: "zip", label: "ZIP with videos + metadata (not implemented)", available: false },
  { value: "json", label: "JSON data export (not implemented)", available: false },
];

const CSV_COLUMNS = [
  "Render and script IDs",
  "Hook, body, and CTA",
  "Score value (illustrative)",
  "Avatar, voice, and job status",
  "Video URL, when the backend has one",
];

const HEADER = {
  eyebrow: "Export Manager",
  title: "Export script metadata.",
  description:
    "With a running backend, download a CSV of scripts and render-job metadata. The browser demo has no export files, and ZIP or JSON packaging is not implemented.",
};

export function Exports() {
  const navigate = useNavigate();
  const { renders, activeCampaign } = useApp();
  const isDemo = api.isDemo();

  function handleExport() {
    if (!activeCampaign || isDemo) return;
    window.location.href = api.getExportUrl(activeCampaign.id);
  }

  if (renders.length === 0) {
    return (
      <div>
        <SectionHeader {...HEADER} />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-white text-xl font-medium mb-2">
            Nothing to export yet
          </h3>
          <p className="text-white/50 text-sm max-w-sm mb-6">
            Plan a campaign before exporting its script metadata.
          </p>
          <Button variant="primary" onClick={() => navigate("/factory")}>
            Go to factory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader {...HEADER} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Options */}
        <div className="lg:col-span-2 space-y-8">
          {/* Format */}
          <fieldset>
            <legend className="text-section-header text-xl text-white mb-4 pb-3 border-b border-white/10 w-full">
              Export format
            </legend>
            <Card className="p-5 space-y-3">
              {FORMAT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={
                    opt.available
                      ? "flex items-center gap-3 cursor-pointer"
                      : "flex items-center gap-3 opacity-50"
                  }
                >
                  <input
                    type="radio"
                    name="format"
                    value={opt.value}
                    defaultChecked={opt.value === "csv"}
                    disabled={!opt.available}
                    className="accent-red-brand w-4 h-4"
                  />
                  <span className="text-black text-sm">{opt.label}</span>
                </label>
              ))}
            </Card>
          </fieldset>

          {/* CSV contents */}
          <div>
            <h3 className="text-section-header text-xl text-white mb-4 pb-3 border-b border-white/10">
              CSV contents
            </h3>
            <Card className="p-5">
              <ul className="space-y-2 text-black text-sm list-disc pl-5">
                {CSV_COLUMNS.map((col) => (
                  <li key={col}>{col}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {/* Preview panel */}
        <div className="sticky top-8">
          <Card className="p-6">
            <p className="text-label text-gray-mid mb-4">Export preview</p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-black">Render job rows</span>
                <span className="font-mono text-black">{renders.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black">Video files</span>
                <span className="font-mono text-black">0</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-light pt-3">
                <span className="text-black font-medium">Format</span>
                <span className="font-mono text-black uppercase">csv</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isDemo || !activeCampaign}
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
            {isDemo && (
              <div className="text-center pt-4">
                <Badge variant="default" className="mb-2">
                  Browser demo
                </Badge>
                <p className="text-xs text-gray-mid mt-1">
                  CSV export requires the backend. The demo has no files to
                  download.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
