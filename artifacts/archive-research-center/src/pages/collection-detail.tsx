import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import {
  useGetCollection,
  getGetCollectionQueryKey,
  useListSources,
  getListSourcesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Clock, FileText, Search, X } from "lucide-react";
import { SourceTypeBadge, ConfidenceBadge, AvailabilityBadge } from "@/components/source-badges";

// ── Inline debounce ──────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Filter options ───────────────────────────────────────────────────────────
const SOURCE_TYPE_OPTIONS = [
  { value: "primary",     label: "Primary Source" },
  { value: "manuscript",  label: "Manuscript" },
  { value: "inscription", label: "Inscription" },
  { value: "record",      label: "Record" },
  { value: "secondary",   label: "Secondary Source" },
  { value: "translation", label: "Translation" },
];

const CONFIDENCE_OPTIONS = [
  { value: "high",      label: "High" },
  { value: "medium",    label: "Medium" },
  { value: "low",       label: "Low" },
  { value: "uncertain", label: "Uncertain" },
];

// ── Page ─────────────────────────────────────────────────────────────────────
export function CollectionDetailPage() {
  const params = useParams();
  const slug = params.slug || "";

  // Collection header (name, description, subject, sourceCount)
  const { data, isLoading: headerLoading } = useGetCollection(slug, {
    query: { enabled: !!slug, queryKey: getGetCollectionQueryKey(slug) },
  });

  // Filter state
  const [q, setQ] = useState("");
  const [sourceType, setSourceType] = useState<string>("");
  const [confidence, setConfidence] = useState<string>("");

  const debouncedQ = useDebounce(q, 300);
  const hasFilters = !!(debouncedQ || sourceType || confidence);

  const clearFilters = useCallback(() => {
    setQ("");
    setSourceType("");
    setConfidence("");
  }, []);

  // Filtered source list — always uses /sources?collection=slug so filters work live
  const { data: sourcesData, isLoading: sourcesLoading } = useListSources(
    {
      collection: slug,
      ...(debouncedQ ? { q: debouncedQ } : {}),
      ...(sourceType ? { sourceType } : {}),
      ...(confidence ? { confidence } : {}),
      limit: 50,
    },
    { query: { enabled: !!slug, queryKey: getListSourcesQueryKey({
      collection: slug,
      ...(debouncedQ ? { q: debouncedQ } : {}),
      ...(sourceType ? { sourceType } : {}),
      ...(confidence ? { confidence } : {}),
      limit: 50,
    }) } }
  );

  const sources = sourcesData?.items ?? [];

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (headerLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 mt-8">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Collection not found.</div>;
  }

  const { collection } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Back */}
      <Link
        href="/collections"
        className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Collections
      </Link>

      {/* Collection header */}
      <header className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm font-semibold tracking-wider text-primary uppercase">
            {collection.subject}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground leading-tight">
            {collection.name}
          </h1>
        </div>
        <p className="text-lg text-foreground/80 max-w-3xl leading-relaxed font-serif">
          {collection.description}
        </p>
        <div className="flex gap-4 border-t border-border pt-6">
          <div className="text-sm">
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Contents
            </span>
            <span className="font-semibold text-lg">{collection.sourceCount} Sources</span>
          </div>
        </div>
      </header>

      {/* Sources section */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <h2 className="text-2xl font-serif">Collection Sources</h2>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground self-start sm:self-auto"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear filters
            </Button>
          )}
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Keyword search */}
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search sources…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 text-sm"
            />
            {q && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setQ("")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Source type */}
          <Select value={sourceType} onValueChange={(v) => setSourceType(v === "_all" ? "" : v)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Source Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All types</SelectItem>
              {SOURCE_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Confidence */}
          <Select value={confidence} onValueChange={(v) => setConfidence(v === "_all" ? "" : v)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All confidence levels</SelectItem>
              {CONFIDENCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {sourcesLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-14 bg-secondary/20 rounded-xl border border-dashed border-border">
            <Search className="h-8 w-8 text-muted-foreground opacity-40 mx-auto mb-3" />
            {hasFilters ? (
              <>
                <p className="text-sm text-muted-foreground font-medium">No sources match these filters.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try broadening your search or{" "}
                  <button
                    onClick={clearFilters}
                    className="text-primary underline underline-offset-2 hover:no-underline"
                  >
                    clear all filters
                  </button>
                  .
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No sources in this collection yet.</p>
            )}
          </div>
        ) : (
          <>
            {hasFilters && (
              <p className="text-xs text-muted-foreground">
                {sources.length} result{sources.length !== 1 ? "s" : ""}
                {debouncedQ ? ` for "${debouncedQ}"` : ""}
              </p>
            )}
            <div className="grid gap-4">
              {sources.map((source) => (
                <Card key={source.id} className="group hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <SourceTypeBadge type={source.sourceType} />
                      <ConfidenceBadge confidence={source.confidence} />
                      <AvailabilityBadge availability={source.availability} />
                    </div>
                    <CardTitle className="text-xl">
                      <Link
                        href={`/sources/${source.id}`}
                        className="hover:text-primary hover:underline underline-offset-4 decoration-primary/30 transition-colors"
                      >
                        {source.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {source.excerpt || source.description || "No excerpt available."}
                    </p>
                  </CardContent>
                  <CardFooter className="bg-secondary/20 border-t border-border/50 py-3 text-xs text-muted-foreground flex flex-wrap gap-4 items-center">
                    {source.author && (
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> {source.author}
                      </span>
                    )}
                    {source.dateLabel && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {source.dateLabel}
                      </span>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
