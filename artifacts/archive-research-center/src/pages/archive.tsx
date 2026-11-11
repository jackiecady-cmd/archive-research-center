import { useState } from "react";
import { useListRepositories, useListSources, ListSourcesParams } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceTypeBadge, ConfidenceBadge, AvailabilityBadge, RepositoryAccessBadge } from "@/components/source-badges";
import { Search, SlidersHorizontal, BookOpen, Clock, FileText, X, Info, RotateCcw, Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useConciergeProfile } from "@/store/concierge-profile";

// Personalised banner content per researcher type
const ARCHIVE_SUGGESTIONS: Record<string, { headline: string; detail: string }> = {
  beginner: {
    headline: "Start with High Confidence sources",
    detail: "As someone new to research, filtering by High Confidence first shows you how the archive grades evidence before you explore wider.",
  },
  pastor: {
    headline: "Relevant to your profile: Jesus of Nazareth collection",
    detail: "Primary sources and scholarship on the historical Jesus, graded by evidence confidence and separated by source type.",
  },
  translator: {
    headline: "Check the Language field on each source record",
    detail: "Every source shows its original language and translation lineage — open the full record to find texts in your working language.",
  },
  archaeologist: {
    headline: "Filter by Primary Source for material evidence",
    detail: "Excavation reports and material culture data are marked Primary Source — start there for first-hand archaeological records.",
  },
  occult_researcher: {
    headline: "Relevant to your profile: Hekate Anthology",
    detail: "Primary and secondary sources on Hekate and related traditions, graded to the same evidence standards as all other collections.",
  },
};

const DEFAULT_PARAMS: ListSourcesParams = { page: 1, limit: 10, q: "" };

export function ArchivePage() {
  const [params, setParams] = useState<ListSourcesParams>(DEFAULT_PARAMS);
  const [yearFromInput, setYearFromInput] = useState("");
  const [yearToInput, setYearToInput] = useState("");
  const { data, isLoading } = useListSources(params);
  const { data: repositories = [] } = useListRepositories();
  const { profile } = useConciergeProfile();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const suggestion = profile && !bannerDismissed ? ARCHIVE_SUGGESTIONS[profile.researcherType] : null;

  const hasActiveFilters =
    !!params.q ||
    !!params.type ||
    !!params.repository ||
    !!params.repositoryAccess ||
    !!params.confidence ||
    !!params.availability ||
    params.yearFrom !== undefined ||
    params.yearTo !== undefined;

  const clearAllFilters = () => {
    setParams(DEFAULT_PARAMS);
    setYearFromInput("");
    setYearToInput("");
  };

  const applyYearFrom = (raw: string) => {
    setYearFromInput(raw);
    const n = raw.trim() === "" ? undefined : parseInt(raw, 10);
    setParams((p) => ({ ...p, yearFrom: isNaN(n as number) ? undefined : n, page: 1 }));
  };

  const applyYearTo = (raw: string) => {
    setYearToInput(raw);
    const n = raw.trim() === "" ? undefined : parseInt(raw, 10);
    setParams((p) => ({ ...p, yearTo: isNaN(n as number) ? undefined : n, page: 1 }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-semibold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Archive Filters
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                aria-label="Clear all filters"
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Holding Repository</label>
              <Select value={params.repository || "all"} onValueChange={(v) => setParams({ ...params, repository: v === "all" ? undefined : v, page: 1 })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Repositories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Repositories</SelectItem>
                  {repositories.map((repository) => (
                    <SelectItem key={repository.slug} value={repository.slug}>
                      {repository.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repository Access</label>
              <Select value={params.repositoryAccess || "all"} onValueChange={(v) => setParams({ ...params, repositoryAccess: v === "all" ? undefined : v as ListSourcesParams["repositoryAccess"], page: 1 })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Access States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Access States</SelectItem>
                  <SelectItem value="digitized">Digitized Manuscript</SelectItem>
                  <SelectItem value="catalog_only">Catalog Only</SelectItem>
                  <SelectItem value="restricted">Repository Restricted</SelectItem>
                  <SelectItem value="physical_access_required">Physical Access Required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source Type</label>
              <Select value={params.type || "all"} onValueChange={(v) => setParams({ ...params, type: v === "all" ? undefined : v, page: 1 })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="primary">Primary Source</SelectItem>
                  <SelectItem value="translation">Translation</SelectItem>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                  <SelectItem value="interpretation">Interpretation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confidence</label>
                {profile?.experience === "beginner" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="What does Confidence mean?">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs leading-relaxed">
                        Sources are graded <strong>High / Medium / Low / Uncertain</strong> based on provenance chain length, documentary evidence, and scholarly consensus. Start with <strong>High Confidence</strong> to build a solid baseline.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Select value={params.confidence || "all"} onValueChange={(v) => setParams({ ...params, confidence: v === "all" ? undefined : v, page: 1 })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High Confidence</SelectItem>
                  <SelectItem value="medium">Medium Confidence</SelectItem>
                  <SelectItem value="low">Low Confidence</SelectItem>
                  <SelectItem value="uncertain">Uncertain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Availability</label>
              <Select value={params.availability || "all"} onValueChange={(v) => setParams({ ...params, availability: v === "all" ? undefined : v, page: 1 })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="public_domain">Public Domain</SelectItem>
                  <SelectItem value="open_access">Open Access</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date range filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approximate Date Range</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Date range help">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs leading-relaxed">
                      Enter years as integers. Use negative numbers for BCE (e.g. <strong>−100</strong> for 100 BCE). Leave blank to show all dates.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="From"
                  className="h-9 text-sm"
                  value={yearFromInput}
                  onChange={(e) => applyYearFrom(e.target.value)}
                  aria-label="Year from"
                />
                <span className="text-muted-foreground text-xs flex-shrink-0">to</span>
                <Input
                  type="number"
                  placeholder="To"
                  className="h-9 text-sm"
                  value={yearToInput}
                  onChange={(e) => applyYearTo(e.target.value)}
                  aria-label="Year to"
                />
              </div>
              {(params.yearFrom !== undefined || params.yearTo !== undefined) && (
                <p className="text-xs text-primary">
                  {params.yearFrom !== undefined && params.yearTo !== undefined
                    ? `${params.yearFrom < 0 ? `${Math.abs(params.yearFrom)} BCE` : `${params.yearFrom} CE`} – ${params.yearTo < 0 ? `${Math.abs(params.yearTo)} BCE` : `${params.yearTo} CE`}`
                    : params.yearFrom !== undefined
                      ? `From ${params.yearFrom < 0 ? `${Math.abs(params.yearFrom)} BCE` : `${params.yearFrom} CE`}`
                      : `To ${params.yearTo! < 0 ? `${Math.abs(params.yearTo!)} BCE` : `${params.yearTo} CE`}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Results */}
      <main className="flex-1 space-y-6">
        {/* Personalised suggestion banner from Concierge profile */}
        {suggestion && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium leading-snug">{suggestion.headline}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.detail}</p>
              <p className="text-xs text-muted-foreground pt-0.5">
                Based on your{" "}
                <Link href="/concierge" className="text-primary hover:underline">Research Concierge</Link>
                {" "}profile: {profile!.researcherLabel}
              </p>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss suggestion"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search titles, excerpts, and descriptions…" 
              className="pl-9 h-11 shadow-sm font-serif bg-card"
              value={params.q || ""}
              onChange={(e) => setParams({ ...params, q: e.target.value, page: 1 })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground border-b border-border pb-4">
          <span>{isLoading ? "Searching…" : `Found ${data?.total || 0} source${data?.total !== 1 ? "s" : ""}`}</span>
          {data && data.total > 0 && (
            <span>Page {data.page} of {Math.ceil(data.total / data.limit)}</span>
          )}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))
          ) : data?.items.length === 0 ? (
            <div className="text-center py-20 bg-secondary/30 rounded-lg border border-dashed border-border">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-serif mb-1">No sources found</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Try adjusting your filters or searching for different keywords to find what you're looking for.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={clearAllFilters}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            data?.items.map((source) => (
              <Card key={source.id} className="group hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <SourceTypeBadge type={source.sourceType} />
                    <ConfidenceBadge confidence={source.confidence} />
                    <AvailabilityBadge availability={source.availability} />
                    {source.repositoryAccessStatus && (
                      <RepositoryAccessBadge status={source.repositoryAccessStatus} />
                    )}
                  </div>
                  <CardTitle className="text-xl">
                    <Link href={`/sources/${source.id}`} className="hover:text-primary hover:underline underline-offset-4 decoration-primary/30 transition-colors">
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
                    <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {source.author}</span>
                  )}
                  {source.dateLabel && (
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {source.dateLabel}</span>
                  )}
                  {source.collectionName && (
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {source.collectionName}</span>
                  )}
                  {source.repository && (
                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {source.repository.name}</span>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {data && data.total > data.limit && (
          <div className="flex justify-center gap-2 pt-6 border-t border-border mt-8">
            <Button 
              variant="outline" 
              disabled={data.page === 1}
              onClick={() => setParams({ ...params, page: (params.page || 1) - 1 })}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              disabled={data.page >= Math.ceil(data.total / data.limit)}
              onClick={() => setParams({ ...params, page: (params.page || 1) + 1 })}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
