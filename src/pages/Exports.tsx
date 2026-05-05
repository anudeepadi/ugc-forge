import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Package } from "lucide-react";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";

const FORMAT_OPTIONS = [
  { value: "zip", label: "ZIP with videos + metadata" },
  { value: "csv", label: "CSV only (script text + metadata)" },
  { value: "json", label: "JSON data export" },
];

export function Exports() {
  const navigate = useNavigate();
  const { renders, scripts } = useApp();
  const [format, setFormat] = useState("zip");
  const [includeScores, setIncludeScores] = useState(true);
  const [includeScriptText, setIncludeScriptText] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const readyRenders = renders.filter(
    (r) => r.status === "queued" || r.status === "complete",
  );

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(true);
    }, 1500);
  }

  if (renders.length === 0) {
    return (
      <div>
        <SectionHeader
          eyebrow="Export Manager"
          title="Package completed renders for testing."
          description="Batch download renders with metadata for A/B testing across ad platforms."
        />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-white text-xl font-medium mb-2">
            Nothing to export yet
          </h3>
          <p className="text-white/50 text-sm max-w-sm mb-6">
            Generate a campaign and renders before exporting.
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
      <SectionHeader
        eyebrow="Export Manager"
        title="Package completed renders for testing."
        description="Batch download renders with metadata for A/B testing across ad platforms."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Options */}
        <div className="lg:col-span-2 space-y-8">
          {/* Batch selection */}
          <div>
            <h3 className="text-section-header text-xl text-white mb-4 pb-3 border-b border-white/10">
              Batch selection
            </h3>
            <Card className="p-5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-red-brand w-4 h-4"
                />
                <span className="text-black text-sm">
                  All ready renders ({readyRenders.length})
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="accent-red-brand w-4 h-4" />
                <span className="text-black text-sm">
                  Scripts only ({scripts.length})
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="accent-red-brand w-4 h-4" />
                <span className="text-black text-sm">
                  High-scoring variants (score ≥ 8.5)
                </span>
              </label>
            </Card>
          </div>

          {/* Format */}
          <div>
            <h3 className="text-section-header text-xl text-white mb-4 pb-3 border-b border-white/10">
              Export format
            </h3>
            <Card className="p-5 space-y-3">
              {FORMAT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="format"
                    value={opt.value}
                    checked={format === opt.value}
                    onChange={() => setFormat(opt.value)}
                    className="accent-red-brand w-4 h-4"
                  />
                  <span className="text-black text-sm">{opt.label}</span>
                </label>
              ))}
            </Card>
          </div>

          {/* Metadata options */}
          <div>
            <h3 className="text-section-header text-xl text-white mb-4 pb-3 border-b border-white/10">
              Metadata options
            </h3>
            <Card className="p-5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeScores}
                  onChange={(e) => setIncludeScores(e.target.checked)}
                  className="accent-red-brand w-4 h-4"
                />
                <span className="text-black text-sm">Include viral scores</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeScriptText}
                  onChange={(e) => setIncludeScriptText(e.target.checked)}
                  className="accent-red-brand w-4 h-4"
                />
                <span className="text-black text-sm">Include script text</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-red-brand w-4 h-4"
                />
                <span className="text-black text-sm">
                  Include render settings
                </span>
              </label>
            </Card>
          </div>
        </div>

        {/* Preview panel */}
        <div className="sticky top-8">
          <Card className="p-6">
            <p className="text-label text-gray-mid mb-4">Export preview</p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-black">Videos</span>
                <span className="font-mono text-black">
                  {readyRenders.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black">Metadata</span>
                <span className="font-mono text-black">1 CSV</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-light pt-3">
                <span className="text-black font-medium">Format</span>
                <span className="font-mono text-black uppercase">{format}</span>
              </div>
            </div>

            {exported ? (
              <div className="text-center py-3">
                <Badge variant="success" className="mb-2">
                  Export complete
                </Badge>
                <p className="text-xs text-gray-mid mt-1">
                  Download link ready
                </p>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={exporting || readyRenders.length === 0}
                onClick={handleExport}
              >
                <Download className="w-4 h-4" />
                {exporting ? "Packaging…" : "Export batch"}
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
