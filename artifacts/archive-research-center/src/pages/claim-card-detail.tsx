import { useParams, Link } from "wouter";
import { useGetEvidenceTrail, getGetEvidenceTrailQueryKey, useAddEvidence, useListSources } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Plus, BookOpen, AlertCircle, RefreshCcw,
  MessageSquare, ExternalLink, Info,
} from "lucide-react";
import { ClaimStatusBadge } from "@/pages/project-detail";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// ── Evidence-role helpers ──────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; badgeClass: string; iconColor: string; borderClass: string }> = {
  supports: {
    label: "Supports",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    iconColor: "text-emerald-600",
    borderClass: "border-l-emerald-500",
  },
  contradicts: {
    label: "Contradicts",
    badgeClass: "bg-red-50 text-red-800 border-red-200",
    iconColor: "text-red-600",
    borderClass: "border-l-red-500",
  },
  contextualizes: {
    label: "Contextualizes",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    iconColor: "text-blue-600",
    borderClass: "border-l-blue-500",
  },
  neutral: {
    label: "Neutral",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    iconColor: "text-slate-500",
    borderClass: "border-l-slate-400",
  },
};

function EvidenceRoleIcon({ role }: { role: string }) {
  const cls = ROLE_CONFIG[role]?.iconColor ?? "text-slate-500";
  switch (role) {
    case "supports":      return <Plus         className={`h-5 w-5 ${cls}`} />;
    case "contradicts":   return <AlertCircle  className={`h-5 w-5 ${cls}`} />;
    case "contextualizes":return <RefreshCcw   className={`h-5 w-5 ${cls}`} />;
    case "neutral":       return <MessageSquare className={`h-5 w-5 ${cls}`} />;
    default:              return <BookOpen     className={`h-5 w-5 ${cls}`} />;
  }
}

function EvidenceRoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.neutral;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.badgeClass}`}>
      <EvidenceRoleIcon role={role} />
      {cfg.label}
    </span>
  );
}

// ── Evidence count bar ─────────────────────────────────────────────────────

function EvidenceSummaryBar({ evidence }: { evidence: { role: string }[] }) {
  const counts = evidence.reduce<Record<string, number>>((acc, e) => {
    acc[e.role] = (acc[e.role] ?? 0) + 1;
    return acc;
  }, {});
  const total = evidence.length;
  const segments = [
    { role: "supports",       count: counts.supports ?? 0,       color: "bg-emerald-500" },
    { role: "contextualizes", count: counts.contextualizes ?? 0, color: "bg-blue-400" },
    { role: "neutral",        count: counts.neutral ?? 0,        color: "bg-slate-300" },
    { role: "contradicts",    count: counts.contradicts ?? 0,    color: "bg-red-500" },
  ].filter((s) => s.count > 0);

  return (
    <div className="space-y-2">
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {segments.map((s) => (
          <div
            key={s.role}
            className={`${s.color} transition-all`}
            style={{ flexGrow: s.count / total }}
            title={`${s.count} ${s.role}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {segments.map((s) => (
          <span key={s.role} className="flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${s.color}`} />
            {s.count} {s.role}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export function ClaimCardDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: trail, isLoading } = useGetEvidenceTrail(id, {
    query: { enabled: !!id, queryKey: getGetEvidenceTrailQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!trail) return <div className="p-12 text-center text-muted-foreground">Claim not found.</div>;

  const { claimCard, evidence } = trail;
  const supportCount = evidence.filter((e) => e.role === "supports").length;
  const contradictCount = evidence.filter((e) => e.role === "contradicts").length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Back nav */}
      <Link
        href={claimCard.projectId ? `/projects/${claimCard.projectId}` : "/claim-cards"}
        className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Claim header */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="border-l-4 border-l-primary p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground leading-tight">
              {claimCard.title}
            </h1>
            <div className="flex-shrink-0">
              <ClaimStatusBadge status={claimCard.status} />
            </div>
          </div>
          <p className="text-lg italic font-serif text-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-4">
            "{claimCard.claim}"
          </p>
          {evidence.length > 0 && <EvidenceSummaryBar evidence={evidence} />}
        </div>
      </div>

      {/* Evidence trail */}
      <div className="space-y-6">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-serif">Evidence Trail</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {evidence.length === 0
                ? "No sources attached yet."
                : `${evidence.length} source${evidence.length !== 1 ? "s" : ""} — ${supportCount} supporting, ${contradictCount} contradicting`}
            </p>
          </div>
          <AddEvidenceDialog claimCardId={claimCard.id} projectId={claimCard.projectId || undefined} />
        </div>

        {/* Evidence separation notice */}
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
          <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary/60" />
          <span>
            <strong className="text-foreground font-semibold">Evidence separation:</strong>{" "}
            This trail links primary archive sources only. Each card shows the source record, its role relative to the claim, and the researcher's rationale — kept strictly separate from translation, scholarly commentary, and AI assistance, which appear on the source's own detail page.
          </span>
        </div>

        {/* Evidence items */}
        {evidence.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-border rounded-xl bg-secondary/10">
            <BookOpen className="h-8 w-8 text-muted-foreground opacity-40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No evidence attached yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add sources to support or contest this claim.</p>
          </div>
        ) : (
          <div className="space-y-4 relative">
            {/* Timeline spine (md+) */}
            <div className="absolute left-6 top-6 bottom-6 w-px bg-border/50 hidden md:block" />

            {evidence.map((ev) => {
              const cfg = ROLE_CONFIG[ev.role] ?? ROLE_CONFIG.neutral;
              return (
                <div key={ev.id} className="relative flex items-start gap-5 group">
                  {/* Role icon in circle */}
                  <div className="hidden md:flex h-12 w-12 rounded-full border-2 border-border bg-card flex-shrink-0 items-center justify-center z-10 group-hover:border-primary/30 transition-colors">
                    <EvidenceRoleIcon role={ev.role} />
                  </div>

                  {/* Evidence card */}
                  <div className={`flex-1 rounded-xl border border-border border-l-4 ${cfg.borderClass} bg-card hover:shadow-sm transition-shadow`}>
                    {/* Card header */}
                    <div className="px-5 pt-4 pb-3 space-y-2">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <EvidenceRoleBadge role={ev.role} />
                        {ev.source?.sourceType && (
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                            {ev.source.sourceType.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-medium leading-snug">
                        <Link
                          href={`/sources/${ev.sourceId}`}
                          className="hover:text-primary hover:underline underline-offset-4 decoration-primary/30 transition-colors inline-flex items-center gap-1"
                        >
                          {ev.source?.title ?? "Unknown Source"}
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        </Link>
                      </h3>
                      {(ev.source?.author || ev.source?.dateLabel) && (
                        <p className="text-xs text-muted-foreground">
                          {[ev.source.author, ev.source.dateLabel].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>

                    {/* Researcher rationale — always visible */}
                    {ev.summary && (
                      <div className="mx-5 mb-4 rounded-md bg-secondary/30 border border-border/50 px-4 py-3">
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                          Researcher Rationale
                        </span>
                        <p className="text-sm leading-relaxed text-foreground/90">{ev.summary}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Evidence dialog ────────────────────────────────────────────────────

function AddEvidenceDialog({ claimCardId, projectId }: { claimCardId: number; projectId?: number }) {
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [role, setRole] = useState<"supports" | "contradicts" | "contextualizes" | "neutral">("supports");
  const [summary, setSummary] = useState("");

  const { data: sources } = useListSources({ limit: 50 });
  const add = useAddEvidence();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAdd = () => {
    if (!sourceId || !summary.trim()) return;
    add.mutate(
      { claimCardId, data: { sourceId: parseInt(sourceId, 10), role, summary } },
      {
        onSuccess: () => {
          toast({ title: "Evidence added" });
          setOpen(false);
          setSourceId("");
          setSummary("");
          queryClient.invalidateQueries({ queryKey: getGetEvidenceTrailQueryKey(claimCardId) });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Evidence
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attach Evidence to Claim</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source</label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a source…" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {sources?.items.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supports">Supports Claim</SelectItem>
                <SelectItem value="contradicts">Contradicts Claim</SelectItem>
                <SelectItem value="contextualizes">Contextualizes</SelectItem>
                <SelectItem value="neutral">Neutral / Mention</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Researcher Rationale</label>
            <p className="text-xs text-muted-foreground">
              Explain how this primary source relates to the claim. This is your researcher analysis — not AI-generated content.
            </p>
            <Textarea
              placeholder="Explain how this source relates to the claim…"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!sourceId || !summary.trim() || add.isPending}>
            Attach Evidence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
