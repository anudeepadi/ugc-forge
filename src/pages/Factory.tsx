import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";

const NICHE_OPTIONS = [
  { value: "dtc-skincare", label: "DTC skincare" },
  { value: "supplements", label: "Supplements" },
  { value: "fitness", label: "Fitness" },
  { value: "tech-gadgets", label: "Tech gadgets" },
  { value: "home-goods", label: "Home goods" },
  { value: "apparel", label: "Apparel" },
];

const TONE_OPTIONS = [
  { value: "casual-founder", label: "Casual founder" },
  { value: "energetic-hype", label: "Energetic hype" },
  { value: "calm-expert", label: "Calm expert" },
  { value: "relatable-user", label: "Relatable user" },
];

const VOICE_OPTIONS = [
  { value: "warm-authentic", label: "Warm & authentic" },
  { value: "direct-punchy", label: "Direct & punchy" },
  { value: "soft-empathetic", label: "Soft & empathetic" },
  { value: "high-energy", label: "High energy" },
];

interface FormData {
  productName: string;
  productUrl: string;
  productDescription: string;
  niche: string;
  targetAudience: string;
  claimsAndProof: string;
  scriptTone: string;
  voiceStyle: string;
}

const INITIAL: FormData = {
  productName: "",
  niche: "dtc-skincare",
  productUrl: "",
  productDescription: "",
  targetAudience: "",
  claimsAndProof: "",
  scriptTone: "casual-founder",
  voiceStyle: "warm-authentic",
};

export function Factory() {
  const navigate = useNavigate();
  const { generateCampaign, isGenerating } = useApp();
  const [form, setForm] = useState<FormData>(INITIAL);

  const isValid =
    form.productName.trim() !== "" && form.productDescription.trim() !== "";

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isGenerating) return;
    await generateCampaign(form);
    navigate("/scripts");
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Campaign Factory"
        title="Describe one product. Generate the testing batch."
        description="The form acts like the SaaS intake layer: gatekeeper, product context, director constraints, and rendering preferences in one workflow."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-10">
          {/* Product brief */}
          <div>
            <h3 className="text-section-header text-xl text-white mb-6 pb-3 border-b border-white/10">
              Product brief
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  name="productName"
                  label="Product name"
                  value={form.productName}
                  onChange={handleChange}
                  placeholder="RadiantLab Vitamin C Serum"
                  required
                />
                <Select
                  name="niche"
                  label="Niche"
                  options={NICHE_OPTIONS}
                  value={form.niche}
                  onChange={handleChange}
                />
              </div>
              <Input
                name="productUrl"
                label="Product URL or listing"
                value={form.productUrl}
                onChange={handleChange}
                placeholder="https://example.com/product"
                type="url"
                hint="Used as source context when you wire real scraping or product APIs."
              />
              <Textarea
                name="productDescription"
                label="Product description"
                value={form.productDescription}
                onChange={handleChange}
                placeholder="A lightweight vitamin C serum for people who want brighter-looking skin without a sticky finish…"
                rows={4}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Textarea
                  name="targetAudience"
                  label="Target audience"
                  value={form.targetAudience}
                  onChange={handleChange}
                  placeholder="Busy women aged 25–40 who buy skincare from TikTok…"
                  rows={3}
                />
                <Textarea
                  name="claimsAndProof"
                  label="Claims and proof points"
                  value={form.claimsAndProof}
                  onChange={handleChange}
                  placeholder="Absorbs in under 30 seconds; fragrance-free…"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Creative direction */}
          <div>
            <h3 className="text-section-header text-xl text-white mb-6 pb-3 border-b border-white/10">
              Creative direction
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                name="scriptTone"
                label="Script tone"
                options={TONE_OPTIONS}
                value={form.scriptTone}
                onChange={handleChange}
              />
              <Select
                name="voiceStyle"
                label="Voice style"
                options={VOICE_OPTIONS}
                value={form.voiceStyle}
                onChange={handleChange}
              />
            </div>
          </div>
        </form>

        {/* Gatekeeper panel */}
        <div className="sticky top-8">
          <Card className="p-6">
            <div className="mb-5 pb-5 border-b border-gray-light">
              <Badge variant="default" className="mb-2">
                Mock-safe generation
              </Badge>
              <p className="text-xs text-gray-mid mt-2 leading-relaxed">
                Demo mode uses sample assets. Backend behavior depends on the
                configured providers.
              </p>
            </div>

            <div className="mb-5 pb-5 border-b border-gray-light">
              <p className="text-label text-gray-mid mb-3">Gatekeeper</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-black">Example monthly quota</span>
                <span className="font-mono font-semibold text-black">120</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-label text-gray-mid mb-3">v1 output</p>
              <ul className="space-y-2">
                {[
                  "Six UGC scripts",
                  "Six render queue items",
                  "Sample score values",
                  "Export workflow preview",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-black"
                  >
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!isValid || isGenerating}
              onClick={handleSubmit}
            >
              <Wand2 className="w-4 h-4" />
              {isGenerating ? "Generating…" : "Generate campaign"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
