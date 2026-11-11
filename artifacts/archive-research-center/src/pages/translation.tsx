/**
 * Translation Center landing page.
 * Shows recent workspaces with search, then the full source browser.
 */
import { useState, useEffect, useCallback } from "react";
import { useListSources } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceTypeBadge, ConfidenceBadge } from "@/components/source-badges";
import {
  Languages, Search, ArrowRight, BookOpen, AlertTriangle,
  FileText, Clock, Layers, History, RotateCcw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────

type WorkspaceSummary = {
  id: number;
  sourceId: number;
  sourceTitle: string;
  sourceAuthor: string | null;
  sourceDateLabel: string | null;
  sourceLanguage: string | null;
  filledLayerCount: number;
  preview: string | null;
  updatedAt: string;
};

// ── Epistemic layer legend ────────────────────────────────────────────────

const LAYER_LEGEND = [
  { label: "Source",       color: "bg-blue-500",    desc: "Original text and script" },
  { label: "Linguistic",   color: "bg-teal-500",    desc: "Transliteration, morphology" },
  { label: "Translation",  color: "bg-emerald-500", desc: "Literal, readable, published" },
  { label: "Interpretive", color: "bg-amber-500",   desc: "Commentary, researcher synthesis" },
  { label: "AI",           color: "bg-rose-500",    desc: "AI drafts — never source evidence" },
];

// ── Debounce ──────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

// ── Main component ────────────────────────────────────────────────────────

export function TranslationPage() {
  // Source browser state
  const [sourceQ, setSourceQ] = useState("");
  const { data, isLoading: sourcesLoading } = useListSources({ page: 1, limit: 50 });

  // Workspace search state
  const [wsQ, setWsQ] = useState("");
  const debouncedWsQ = useDebounce(wsQ, 350);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [wsLoading, setWsLoading] = useState(true);

  const fetchWorkspaces = useCallback((q: string) => {
    setWsLoading(true);
    const url = q.trim()
      ? `/api/translations/workspaces?q=${encodeURIComponent(q)}&limit=20`
      : `/api/translations/workspaces?limit=12`;
    fetch(url, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) return [] as WorkspaceSummary[];
        return r.json() as Promise<WorkspaceSummary[]>;
      })
      .then((rows: WorkspaceSummary[]) => {
        setWorkspaces(Array.isArray(rows) ? rows : []);
        setWsLoading(false);
      })
      .catch(() => setWsLoading(false));
  }, []);

  useEffect(() => { fetchWorkspaces(debouncedWsQ); }, [debouncedWsQ, fetchWorkspaces]);

  const filteredSources = data?.items.filter((s) => {
    if (!sourceQ.trim()) return true;
    const lower = sourceQ.toLowerCase();
    return (
      s.title.toLowerCase().includes(lower) ||
      (s.author ?? "").toLowerCase().includes(lower) ||
      (s.language ?? "").toLowerCase().includes(lower)
    );
  }) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">

      {/* Header */}
      <header className="space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold">
          <Languages className="h-4 w-4" /> Translation Center
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif">Translation & Manuscript Analysis</h1>
        <p className="text-muted-foreground leading-relaxed">
          Open a workspace for any archive source. Nine epistemic layers are kept strictly
          separate — from original script through published translations to researcher
          interpretation — so no layer can be mistaken for another.
        </p>
      </header>

      {/* Epistemic layer system */}
      <section className="rounded-xl border border-border bg-secondary/20 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Layers className="h-4 w-4 text-primary" /> Nine visible epistemic layers
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {LAYER_LEGEND.map((l) => (
            <div key={l.label} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${l.color}`} />
                <span className="text-xs font-semibold">{l.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{l.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 pt-1 border-t border-border text-xs text-muted-foreground leading-relaxed">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>AI content is always confined to the AI layer, labelled "Not Evidence," and never shown alongside source text without a disclaimer.</span>
        </div>
      </section>

      {/* ── See it in action ──────────────────────────────────────────────── */}
      {(() => {
        const featured = (data?.items ?? [])
          .filter((s) => s.originalLanguage)
          .slice(0, 3);
        if (featured.length === 0) return null;
        return (
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                <Languages className="h-3.5 w-3.5" /> Try it with a real ancient source
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                These sources carry original-script text — Greek, Hebrew, Latin, or Aramaic. Open one and the
                Original Text layer pre-fills automatically, with RTL scripts rendering right-to-left.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {featured.map((s) => (
                <Link key={s.id} href={`/translation/${s.id}`}>
                  <div className="group rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all p-4 h-full flex flex-col gap-2 cursor-pointer">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                      {s.originalLanguage}
                    </div>
                    <p className="font-serif text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {s.title}
                    </p>
                    {s.author && (
                      <p className="text-xs text-muted-foreground mt-auto">{s.author}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-primary font-medium mt-1">
                      Open workspace <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* ── Saved workspaces + search ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-serif flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            {wsQ.trim() ? "Search results" : "Recent workspaces"}
          </h2>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across workspace content…"
              className="pl-9 text-sm"
              value={wsQ}
              onChange={(e) => setWsQ(e.target.value)}
            />
            {wsQ && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setWsQ("")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {wsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-12 w-full mb-3" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/10 py-10 text-center">
            {wsQ.trim() ? (
              <>
                <Search className="h-8 w-8 mx-auto text-muted-foreground opacity-40 mb-3" />
                <p className="text-sm text-muted-foreground">No workspaces match "<span className="font-medium">{wsQ}</span>".</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setWsQ("")}>Clear search</Button>
              </>
            ) : (
              <>
                <Languages className="h-8 w-8 mx-auto text-muted-foreground opacity-40 mb-3" />
                <p className="text-sm text-muted-foreground">No workspaces yet. Open a source below to start.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <Card key={ws.id} className="group hover:border-primary/30 hover:shadow-sm transition-all flex flex-col">
                <CardHeader className="pb-2 flex-none">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {ws.filledLayerCount} of 9 layers
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(ws.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-serif leading-snug line-clamp-2">
                    {ws.sourceTitle}
                  </CardTitle>
                  {(ws.sourceAuthor || ws.sourceDateLabel) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3 flex-shrink-0" />
                      {[ws.sourceAuthor, ws.sourceDateLabel].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-3">
                  {ws.preview && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 font-mono bg-secondary/30 rounded p-2">
                      {ws.preview}
                    </p>
                  )}
                  <Button asChild size="sm" className="w-full mt-auto gap-2">
                    <Link href={`/translation/${ws.sourceId}`}>
                      <Languages className="h-3.5 w-3.5" />
                      Continue Workspace
                      <ArrowRight className="ml-auto h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Source browser ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-serif">Choose a source to translate</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by title, author, language…"
              className="pl-9 text-sm"
              value={sourceQ}
              onChange={(e) => setSourceQ(e.target.value)}
            />
          </div>
        </div>

        {sourcesLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed border-border">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground opacity-40 mb-3" />
            <p className="text-sm text-muted-foreground">No sources match your filter.</p>
            {sourceQ && (
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSourceQ("")}>
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredSources.map((source) => (
              <Card key={source.id} className="group hover:border-primary/30 hover:shadow-sm transition-all">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <SourceTypeBadge type={source.sourceType} />
                    <ConfidenceBadge confidence={source.confidence} />
                    {source.language && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border font-medium">
                        {source.language}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base font-serif leading-snug line-clamp-2">
                    {source.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {source.author && (
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {source.author}</span>
                    )}
                    {source.dateLabel && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {source.dateLabel}</span>
                    )}
                  </div>
                  <Button asChild size="sm" className="w-full gap-2 group-hover:bg-primary/90">
                    <Link href={`/translation/${source.id}`}>
                      <Languages className="h-3.5 w-3.5" />
                      Open Translation Workspace
                      <ArrowRight className="ml-auto h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-semibold">How translation workspaces work</h3>
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <li className="flex gap-2">
            <span className="text-primary font-bold flex-shrink-0">1.</span>
            Choose a source above — the workspace opens with any stored original-script text pre-loaded.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold flex-shrink-0">2.</span>
            Fill in as many layers as you need. Each layer auto-saves as you type.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold flex-shrink-0">3.</span>
            Use the Export button to download your work as Markdown, copy it to the clipboard, or print to PDF.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold flex-shrink-0">4.</span>
            The AI Assistance layer is available for drafts — always labelled "Not Evidence" and kept separate.
          </li>
        </ul>
      </section>
    </div>
  );
}
