/**
 * Translation Workspace — layered linguistic analysis for a single source.
 *
 * Epistemic layer order (most primary → most interpretive):
 *   1. Original Text        — from source record (editable copy for focus)
 *   2. Transliteration      — phonetic rendering
 *   3. Morphology Notes     — word-by-word grammatical breakdown
 *   4. Literal Translation  — word-for-word rendering
 *   5. Readable Translation — natural-language rendering
 *   6. Published Translation — existing scholarly reference (with attribution)
 *   7. Commentary           — contextual and historical notes
 *   8. AI Assistance        — clearly marked, never source evidence
 *   9. User Interpretation  — researcher's own synthesis (labelled accordingly)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useGetSource, getGetSourceQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Save, Languages, AlertTriangle, BookOpen, Bot,
  User, Quote, Lightbulb, ChevronDown, ChevronUp, Info,
  CheckCircle2, Clock, Download, Copy, Printer,
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ConfidenceBadge, SourceTypeBadge } from "@/components/source-badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

// ── Types ──────────────────────────────────────────────────────────────────

type TranslationLayer = {
  originalText: string;
  transliteration: string;
  morphologyNotes: string;
  literalTranslation: string;
  readableTranslation: string;
  publishedTranslation: string;
  publishedTranslationAttribution: string;
  commentary: string;
  userInterpretation: string;
  aiAssistance: string;
};

const EMPTY_LAYERS: TranslationLayer = {
  originalText: "",
  transliteration: "",
  morphologyNotes: "",
  literalTranslation: "",
  readableTranslation: "",
  publishedTranslation: "",
  publishedTranslationAttribution: "",
  commentary: "",
  userInterpretation: "",
  aiAssistance: "",
};

type LayerMeta = {
  key: keyof TranslationLayer;
  label: string;
  icon: React.ReactNode;
  description: string;
  epistemic: "source" | "linguistic" | "translation" | "interpretive" | "ai";
  placeholder: string;
  isSmall?: boolean; // single-line input
};

const LAYERS: LayerMeta[] = [
  {
    key: "originalText",
    label: "Original Text",
    icon: <Quote className="h-4 w-4" />,
    description: "The source passage you are analysing. Pre-filled from the archive excerpt — edit to focus on a specific section.",
    epistemic: "source",
    placeholder: "Paste the original-language text or relevant excerpt here…",
  },
  {
    key: "transliteration",
    label: "Transliteration",
    icon: <Languages className="h-4 w-4" />,
    description: "Phonetic rendering of the original script into Latin characters (e.g. Greek, Hebrew, Arabic, Coptic).",
    epistemic: "linguistic",
    placeholder: "e.g. Ἑκάτη → Hekatē",
  },
  {
    key: "morphologyNotes",
    label: "Morphology / Lexical Notes",
    icon: <BookOpen className="h-4 w-4" />,
    description: "Word-by-word grammatical analysis: part of speech, case, tense, root, lexical range. Each entry on its own line.",
    epistemic: "linguistic",
    placeholder: "ἄκρης — genitive singular feminine of ἄκρα (peak, tip, headland)…",
  },
  {
    key: "literalTranslation",
    label: "Literal Translation",
    icon: <Languages className="h-4 w-4" />,
    description: "Word-for-word rendering that preserves the grammatical structure of the original, even if awkward in English.",
    epistemic: "translation",
    placeholder: "Translate each word or phrase as directly as possible…",
  },
  {
    key: "readableTranslation",
    label: "Readable Translation",
    icon: <Languages className="h-4 w-4" />,
    description: "Natural-language rendering that prioritises clarity for a modern reader while remaining faithful to the source.",
    epistemic: "translation",
    placeholder: "Render the same passage in clear, natural English…",
  },
  {
    key: "publishedTranslation",
    label: "Published Translation",
    icon: <BookOpen className="h-4 w-4" />,
    description: "An existing scholarly or published translation for reference. Always cite the translator and edition.",
    epistemic: "translation",
    placeholder: "Paste the published translation text here…",
  },
  {
    key: "publishedTranslationAttribution",
    label: "Attribution for Published Translation",
    icon: <BookOpen className="h-4 w-4" />,
    description: "Full citation for the published translation above.",
    epistemic: "translation",
    placeholder: 'e.g. Hesiod, Theogony, trans. Hugh G. Evelyn-White (London: Heinemann, 1914), line 411.',
    isSmall: true,
  },
  {
    key: "commentary",
    label: "Commentary",
    icon: <Lightbulb className="h-4 w-4" />,
    description: "Contextual, historical, or theological notes that help interpret the passage. Cite sources where possible.",
    epistemic: "interpretive",
    placeholder: "What historical or religious context explains this passage?…",
  },
  {
    key: "userInterpretation",
    label: "User Interpretation",
    icon: <User className="h-4 w-4" />,
    description: "Your own synthesis, hypothesis, or reading. Labelled as researcher interpretation — not source evidence.",
    epistemic: "interpretive",
    placeholder: "State your interpretation clearly and note what evidence supports it…",
  },
  {
    key: "aiAssistance",
    label: "AI Assistance",
    icon: <Bot className="h-4 w-4" />,
    description: "AI-generated drafts or suggestions. Always verify against the original. Never cite this as source evidence.",
    epistemic: "ai",
    placeholder: "Paste AI-generated suggestions here for your own reference…",
  },
];

const EPISTEMIC_COLORS: Record<LayerMeta["epistemic"], string> = {
  source:      "border-l-blue-600 bg-blue-50/40 dark:bg-blue-950/20",
  linguistic:  "border-l-teal-600 bg-teal-50/40 dark:bg-teal-950/20",
  translation: "border-l-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20",
  interpretive:"border-l-amber-600 bg-amber-50/40 dark:bg-amber-950/20",
  ai:          "border-l-rose-600 bg-rose-50/40 dark:bg-rose-950/20",
};
const EPISTEMIC_BADGE: Record<LayerMeta["epistemic"], { label: string; class: string }> = {
  source:      { label: "Source", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  linguistic:  { label: "Linguistic", class: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300" },
  translation: { label: "Translation", class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  interpretive:{ label: "Interpretive", class: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  ai:          { label: "AI — Not Evidence", class: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
};

const STORAGE_KEY = (id: number) => `arc_translation_${id}`;

// ── Debounce helper ────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Main component ─────────────────────────────────────────────────────────

export function TranslationWorkspacePage() {
  const params = useParams();
  const sourceId = parseInt(params.sourceId || "0", 10);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Source record
  const { data: source, isLoading: sourceLoading } = useGetSource(sourceId, {
    query: { enabled: !!sourceId, queryKey: getGetSourceQueryKey(sourceId) },
  });

  // Workspace state (persisted locally; synced to API on change)
  const [layers, setLayers] = useState<TranslationLayer>(EMPTY_LAYERS);
  const [translationId, setTranslationId] = useState<number | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const debouncedLayers = useDebounce(layers, 1200);
  const initializedRef = useRef(false);

  // Load workspace from API on mount
  useEffect(() => {
    if (!sourceId) return;
    // Try localStorage first (instant)
    try {
      const cached = localStorage.getItem(STORAGE_KEY(sourceId));
      if (cached) {
        const c = JSON.parse(cached);
        if (c.layers) setLayers(c.layers);
        if (c.translationId) setTranslationId(c.translationId);
      }
    } catch {}

    // Then fetch/create from API
    fetch(`/api/translations?sourceId=${sourceId}`)
      .then((r) => r.json())
      .then((data) => {
        setTranslationId(data.id);
        const serverLayers: TranslationLayer = {
          originalText: data.originalText ?? "",
          transliteration: data.transliteration ?? "",
          morphologyNotes: data.morphologyNotes ?? "",
          literalTranslation: data.literalTranslation ?? "",
          readableTranslation: data.readableTranslation ?? "",
          publishedTranslation: data.publishedTranslation ?? "",
          publishedTranslationAttribution: data.publishedTranslationAttribution ?? "",
          commentary: data.commentary ?? "",
          userInterpretation: data.userInterpretation ?? "",
          aiAssistance: data.aiAssistance ?? "",
        };
        setLayers((prev) => {
          // If server has content, prefer it; otherwise keep local draft
          const hasServerContent = Object.values(serverLayers).some((v) => v.trim());
          return hasServerContent ? serverLayers : prev;
        });
        setLoadingWorkspace(false);
        initializedRef.current = true;
      })
      .catch(() => {
        setLoadingWorkspace(false);
        initializedRef.current = true;
      });
  }, [sourceId]);

  // Pre-fill Original Text — prefer dedicated original-script field, fall back to excerpt
  useEffect(() => {
    if (!source || !initializedRef.current) return;
    setLayers((prev) => {
      if (prev.originalText.trim()) return prev;
      const prefill =
        source.originalLanguageText?.trim() ||
        source.excerpt?.trim() ||
        source.description?.trim() ||
        "";
      return { ...prev, originalText: prefill };
    });
  }, [source, loadingWorkspace]);

  // Auto-save to API + localStorage whenever debounced layers change
  useEffect(() => {
    if (!translationId || !initializedRef.current) return;
    const nonEmpty = Object.entries(debouncedLayers).some(([, v]) => v.trim());
    if (!nonEmpty) return;
    setSaving(true);
    fetch(`/api/translations/${translationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(debouncedLayers),
    })
      .then((r) => r.json())
      .then(() => {
        setLastSaved(new Date());
        setSaving(false);
        try {
          localStorage.setItem(STORAGE_KEY(sourceId), JSON.stringify({ layers: debouncedLayers, translationId }));
        } catch {}
      })
      .catch(() => setSaving(false));
  }, [debouncedLayers, translationId, sourceId]);

  const updateLayer = useCallback((key: keyof TranslationLayer, value: string) => {
    setLayers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // ── Export helpers ───────────────────────────────────────────────────────

  const buildMarkdown = (): string => {
    const lines: string[] = [];
    lines.push(`# ${source?.title ?? "Translation Workspace"}`);
    lines.push("");
    if (source?.author) lines.push(`**Author:** ${source.author}`);
    if (source?.dateLabel) lines.push(`**Date:** ${source.dateLabel}`);
    if (source?.language) lines.push(`**Language:** ${source.language}`);
    if (source?.confidence) lines.push(`**Confidence:** ${source.confidence}`);
    if (source?.provenance) { lines.push(""); lines.push(`**Provenance:** ${source.provenance}`); }
    lines.push(""); lines.push("---"); lines.push("");

    type LayerSpec = { key: keyof TranslationLayer; heading: string; disclaimer?: string };
    const specs: LayerSpec[] = [
      { key: "originalText",       heading: "## Original Text" },
      { key: "transliteration",    heading: "## Transliteration _(Linguistic layer)_" },
      { key: "morphologyNotes",    heading: "## Morphology / Lexical Notes _(Linguistic layer)_" },
      { key: "literalTranslation", heading: "## Literal Translation" },
      { key: "readableTranslation",heading: "## Readable Translation" },
      { key: "publishedTranslation",heading: "## Published Translation" },
      { key: "commentary",         heading: "## Commentary _(Interpretive layer)_" },
      { key: "userInterpretation", heading: "## Researcher Interpretation _(Interpretive layer)_",
        disclaimer: "> **Researcher interpretation** — labelled as researcher analysis, not primary evidence." },
      { key: "aiAssistance",       heading: "## AI Assistance",
        disclaimer: "> ⚠️ **AI-generated — not source evidence.** Verify against primary sources before citing." },
    ];

    let any = false;
    for (const { key, heading, disclaimer } of specs) {
      const val = layers[key]?.trim();
      if (!val) continue;
      any = true;
      lines.push(heading); lines.push("");
      if (disclaimer) { lines.push(disclaimer); lines.push(""); }
      lines.push(val); lines.push("");
      // Attribution for published translation
      if (key === "publishedTranslation" && layers.publishedTranslationAttribution?.trim()) {
        lines.push(`*Attribution: ${layers.publishedTranslationAttribution.trim()}*`);
        lines.push("");
      }
    }
    if (!any) { lines.push("_No layers filled in yet._"); lines.push(""); }
    lines.push("---");
    lines.push(`*Exported from Archive & Research Center · ${new Date().toLocaleDateString()}*`);
    return lines.join("\n");
  };

  const handleDownloadMarkdown = () => {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(source?.title ?? "translation").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Markdown file saved." });
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdown());
      toast({ title: "Copied", description: "Markdown copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  const handlePrintPdf = () => {
    const md = buildMarkdown();
    // Convert minimal markdown → HTML for the print window
    const htmlLines = md
      .split("\n")
      .map((l) => {
        if (l.startsWith("## ")) return `<h2>${l.slice(3)}</h2>`;
        if (l.startsWith("# ")) return `<h1>${l.slice(2)}</h1>`;
        if (l.startsWith("> ")) return `<blockquote>${l.slice(2)}</blockquote>`;
        if (l.startsWith("---")) return `<hr/>`;
        if (l.trim() === "") return `<br/>`;
        // Bold **text**
        const bolded = l.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
        return `<p>${bolded}</p>`;
      })
      .join("");
    const win = window.open("", "_blank");
    if (!win) { toast({ title: "Popup blocked", description: "Allow popups to use print-to-PDF.", variant: "destructive" }); return; }
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${source?.title ?? "Translation"}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 740px; margin: 40px auto; color: #111; line-height: 1.7; }
        h1 { font-size: 1.8rem; border-bottom: 2px solid #ccc; padding-bottom: .4rem; }
        h2 { font-size: 1.1rem; color: #444; margin-top: 1.6rem; }
        blockquote { border-left: 4px solid #e05; padding: .3rem .8rem; background: #fff5f5; color: #700; margin: .5rem 0; }
        hr { border: none; border-top: 1px solid #ddd; margin: 1.5rem 0; }
        p { margin: .25rem 0; } br { display: none; }
        @media print { body { margin: 1cm; } }
      </style></head><body>${htmlLines}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  // ── Loading / error states ───────────────────────────────────────────────

  if (!sourceId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Languages className="h-12 w-12 mx-auto text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-serif mb-2">No source selected</h2>
        <p className="text-muted-foreground text-sm mb-6">Open a source record and choose "Open in Translation Center" to begin.</p>
        <Button asChild variant="outline"><Link href="/archive">Browse the Archive</Link></Button>
      </div>
    );
  }

  if (sourceLoading || loadingWorkspace) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!source) {
    return <div className="p-8 text-center">Source not found.</div>;
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
          <Link href={`/sources/${sourceId}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to source
          </Link>
          <span className="hidden sm:inline text-border">|</span>
          <Link href="/translation" className="hover:text-foreground transition-colors hidden sm:inline">
            Translation Center
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save status */}
          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
            {saving && (
              <span className="flex items-center gap-1.5 text-primary">
                <Save className="h-3.5 w-3.5 animate-pulse" /> Saving…
              </span>
            )}
            {!saving && lastSaved && (
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {!saving && !lastSaved && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Auto-saves
              </span>
            )}
          </div>

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Export workspace
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadMarkdown} className="gap-2">
                <Download className="h-4 w-4" /> Download as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyMarkdown} className="gap-2">
                <Copy className="h-4 w-4" /> Copy as Markdown
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePrintPdf} className="gap-2">
                <Printer className="h-4 w-4" /> Print / Save as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Source header */}
      <header className="space-y-3 pb-6 border-b border-border">
        <div className="flex flex-wrap gap-2">
          <SourceTypeBadge type={source.sourceType} />
          <ConfidenceBadge confidence={source.confidence} />
          {source.language && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border font-medium">
              {source.language}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif leading-tight">{source.title}</h1>
        {(source.author || source.dateLabel) && (
          <p className="text-sm text-muted-foreground">
            {[source.author, source.dateLabel].filter(Boolean).join(" · ")}
          </p>
        )}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border text-xs text-muted-foreground leading-relaxed">
          <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>
            <strong className="text-foreground">Provenance:</strong>{" "}
            {source.provenance}
            {source.confidence && (
              <> · Confidence: <strong className="text-foreground capitalize">{source.confidence}</strong></>
            )}
          </span>
        </div>
      </header>

      {/* AI disclaimer — always visible */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20">
        <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">
          <strong className="text-rose-800 dark:text-rose-300">AI Assistance is never source evidence.</strong>
          {" "}All AI-generated content in this workspace is marked with a red border and labelled "AI — Not Evidence." It must be verified against primary sources and cited correctly before use in any research claim or publication.
        </div>
      </div>

      {/* Layer legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(EPISTEMIC_BADGE).map(([key, val]) => (
          <span key={key} className={`px-2.5 py-1 rounded-full font-medium ${val.class}`}>{val.label}</span>
        ))}
      </div>

      {/* Translation layers */}
      <div className="space-y-4">
        {LAYERS.map((layer) => {
          const isCollapsed = collapsed.has(layer.key);
          const isEmpty = !layers[layer.key]?.trim();
          const badge = EPISTEMIC_BADGE[layer.epistemic];
          const colorClass = EPISTEMIC_COLORS[layer.epistemic];

          return (
            <div key={layer.key} className={`rounded-xl border border-l-4 ${colorClass}`}>
              {/* Layer header */}
              <button
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={() => toggleCollapse(layer.key)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-muted-foreground flex-shrink-0">{layer.icon}</span>
                  <span className="font-semibold text-sm truncate">{layer.label}</span>
                  <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${badge.class}`}>
                    {badge.label}
                  </span>
                  {isEmpty && !isCollapsed && (
                    <span className="text-xs text-muted-foreground italic hidden sm:inline">(empty)</span>
                  )}
                </div>
                {isCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              </button>

              {/* Layer body */}
              {!isCollapsed && (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">{layer.description}</p>
                  {layer.epistemic === "ai" && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" /> AI-generated — not source evidence. Verify before use.
                    </div>
                  )}
                  {layer.epistemic === "interpretive" && layer.key === "userInterpretation" && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                      <User className="h-3.5 w-3.5" /> Your interpretation — labelled as researcher analysis, not primary evidence.
                    </div>
                  )}
                  {layer.isSmall ? (
                    <Input
                      value={layers[layer.key]}
                      onChange={(e) => updateLayer(layer.key, e.target.value)}
                      placeholder={layer.placeholder}
                      className="text-sm font-mono"
                    />
                  ) : (
                    <Textarea
                      value={layers[layer.key]}
                      onChange={(e) => updateLayer(layer.key, e.target.value)}
                      placeholder={layer.placeholder}
                      className="min-h-[120px] text-sm leading-relaxed resize-y font-mono"
                      dir={layer.key === "originalText" ? "auto" : undefined}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer nav */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Work is auto-saved as you type — no manual save needed.</p>
          <p>To cite this work, reference the source record: <Link href={`/sources/${sourceId}`} className="text-primary hover:underline">{source.title}</Link></p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm">
            <Link href={`/sources/${sourceId}`}><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Source</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/translation">All Workspaces</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
