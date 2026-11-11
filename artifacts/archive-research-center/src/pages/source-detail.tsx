import { useParams } from "wouter";
import {
  useGetSource,
  getGetSourceQueryKey,
  useListResearchProjects,
  getListResearchProjectsQueryKey,
  useSaveSource,
  useCreateResearchProject,
  useUpdateSource,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SourceTypeBadge, ConfidenceBadge, AvailabilityBadge, RepositoryAccessBadge } from "@/components/source-badges";
import { TranslationDisclosure } from "@/components/translation-disclosure";
import { isCitationOnly } from "@workspace/config/legal";
import {
  ExternalLink, BookmarkPlus, ArrowLeft, Building2, Quote,
  AlertTriangle, Languages, Pencil, Check, X,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { canEditCatalog, useAuth } from "@/lib/auth";

// ── Main page ─────────────────────────────────────────────────────────────────

export function SourceDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: source, isLoading } = useGetSource(id, { query: { enabled: !!id, queryKey: getGetSourceQueryKey(id) } });
  const { user } = useAuth();
  const isEditor = canEditCatalog(user);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!source) {
    return <div className="p-8 text-center">Source not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/archive" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Archive
        </Link>
      </div>

      <header className="space-y-6 border-b border-border pb-8">
        <div className="flex flex-wrap gap-3">
          <SourceTypeBadge type={source.sourceType} />
          <ConfidenceBadge confidence={source.confidence} />
          <AvailabilityBadge availability={source.availability} />
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-serif leading-tight">{source.title}</h1>
        
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm bg-secondary/30 p-4 rounded-lg border border-border">
          {source.author && (
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Author / Creator</div>
              <div className="font-medium">{source.author}</div>
            </div>
          )}
          {source.dateLabel && (
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Dating</div>
              <div className="font-medium">{source.dateLabel}</div>
            </div>
          )}
          {source.language && (
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Language</div>
              <div className="font-medium">{source.language}</div>
            </div>
          )}
          {source.collectionName && (
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Collection</div>
              <div className="font-medium text-primary">
                <Link href={`/collections/${source.collectionSlug}`} className="hover:underline">
                  {source.collectionName}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <SaveToProjectDialog sourceId={source.id} />
          <Button variant="outline" asChild className="sm:w-auto">
            <Link href={`/translation/${source.id}`}>
              <Languages className="mr-2 h-4 w-4" /> Open in Translation Center
            </Link>
          </Button>
          {source.externalUrl && (
            <Button variant="outline" asChild className="sm:w-auto">
              <a href={source.externalUrl} target="_blank" rel="noopener noreferrer">
                View Original <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h3 className="text-xl font-serif mb-4 flex items-center gap-2">
              <Quote className="h-5 w-5 text-muted-foreground" />
              Excerpt / Description
            </h3>
            {isCitationOnly(source) ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Citation and link only. The source text is not shown here.
                {source.externalUrl ? (
                  <>
                    {" "}
                    <a href={source.externalUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                      Open the holding
                    </a>
                  </>
                ) : null}
              </p>
            ) : (
              <>
                {source.excerpt ? <TranslationDisclosure /> : null}
                <div className="prose prose-stone dark:prose-invert max-w-none">
                  <p className="text-lg leading-relaxed text-foreground/90 font-serif">
                    {source.excerpt || source.description}
                  </p>
                </div>
              </>
            )}
          </section>

          {isCitationOnly(source) ? null : (
            <OriginalLanguageSection source={source} isEditor={isEditor} sourceId={id} />
          )}

          <section>
            <h3 className="text-xl font-serif mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Provenance
            </h3>
            <Card className="bg-card">
              <CardContent className="p-6">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {source.provenance}
                </p>
                {source.chronology && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-sm font-semibold mb-2">Chronology Notes</h4>
                    <p className="text-sm text-muted-foreground">{source.chronology}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {source.repository && (
            <section>
              <h3 className="text-xl font-serif mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Holding Repository
              </h3>
              <Card className="bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <a
                        href={source.repository.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-serif text-lg font-semibold text-primary hover:underline"
                      >
                        {source.repository.name}
                        <ExternalLink className="inline ml-1.5 h-3.5 w-3.5" />
                      </a>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                        {source.repository.institutionType}
                      </p>
                    </div>
                    {source.repositoryAccessStatus && (
                      <RepositoryAccessBadge status={source.repositoryAccessStatus} />
                    )}
                  </div>
                  {source.repositoryAccessNote && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {source.repositoryAccessNote}
                    </p>
                  )}
                  <p className="text-xs leading-relaxed border-t border-border pt-4 text-muted-foreground">
                    Repository access describes whether this holding can be viewed online or consulted at the institution. It is separate from copyright and reproduction rights.
                  </p>
                </CardContent>
              </Card>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="bg-secondary/10 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Rights & Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div>
                <strong className="block mb-1">Statement</strong>
                <span className="text-muted-foreground">{source.rightsStatement || "No explicit rights statement provided."}</span>
              </div>
              <div className="p-3 bg-card rounded border border-border text-xs leading-relaxed">
                The Archive & Research Center presents this material for scholarly use. Users are responsible for obtaining permissions for commercial reproduction.
              </div>
            </CardContent>
          </Card>
          
          {source.tags && source.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {source.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ── Original Language Section ─────────────────────────────────────────────────

interface SourceShape {
  id: number;
  originalLanguageText?: string | null;
  originalLanguage?: string | null;
  excerpt?: string | null;
  description?: string | null;
}

function OriginalLanguageSection({
  source,
  isEditor,
  sourceId,
}: {
  source: SourceShape;
  isEditor: boolean;
  sourceId: number;
}) {
  const [editing, setEditing] = useState(false);
  const [langLabel, setLangLabel] = useState(source.originalLanguage ?? "");
  const [langText, setLangText] = useState(source.originalLanguageText ?? "");
  const updateSource = useUpdateSource();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Keep local state in sync if the source record changes (e.g. after a save)
  useEffect(() => {
    if (!editing) {
      setLangLabel(source.originalLanguage ?? "");
      setLangText(source.originalLanguageText ?? "");
    }
  }, [source.originalLanguage, source.originalLanguageText, editing]);

  const handleSave = () => {
    updateSource.mutate(
      {
        id: sourceId,
        data: {
          originalLanguage: langLabel.trim() || undefined,
          originalLanguageText: langText.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Saved", description: "Original-language text updated." });
          setEditing(false);
          queryClient.invalidateQueries({ queryKey: getGetSourceQueryKey(sourceId) });
        },
        onError: () => {
          toast({ title: "Save failed", description: "Could not save changes.", variant: "destructive" });
        },
      }
    );
  };

  const handleCancel = () => {
    setLangLabel(source.originalLanguage ?? "");
    setLangText(source.originalLanguageText ?? "");
    setEditing(false);
  };

  // Show the section if there is existing text OR if the editor is active (so they can add it)
  if (!source.originalLanguageText && !isEditor) return null;

  return (
    <section>
      <h3 className="text-xl font-serif mb-4 flex items-center gap-2">
        <Languages className="h-5 w-5 text-muted-foreground" />
        Original Language Text
        {source.originalLanguage && !editing && (
          <span className="text-sm font-sans font-normal text-muted-foreground">
            — {source.originalLanguage}
          </span>
        )}
        {isEditor && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 transition-colors"
            aria-label="Edit original-language text"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
      </h3>

      {editing ? (
        /* ── Editor panel ── */
        <div className="rounded-lg border border-amber-300 bg-amber-50/40 dark:border-amber-700/40 dark:bg-amber-950/20 p-5 space-y-4">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
            <Pencil className="h-3 w-3" /> Editor mode — changes are saved to the source record
          </p>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Language label (e.g. Greek, Hebrew, Latin, Aramaic)
            </label>
            <Input
              value={langLabel}
              onChange={(e) => setLangLabel(e.target.value)}
              placeholder="e.g. Greek (Koinē)"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Original-script text
            </label>
            <Textarea
              value={langText}
              onChange={(e) => setLangText(e.target.value)}
              placeholder="Paste original-script text here…"
              className="font-mono text-base leading-relaxed min-h-[120px] resize-y"
              dir="auto"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              Script direction is detected automatically. RTL scripts (Hebrew, Arabic, Syriac) will display right-to-left.
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateSource.isPending}
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              {updateSource.isPending ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </div>
      ) : source.originalLanguageText ? (
        /* ── Read-only display ── */
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 dark:border-blue-900/30 dark:bg-blue-950/20 p-5">
          <p className="font-mono text-base leading-relaxed whitespace-pre-wrap text-foreground" dir="auto">
            {source.originalLanguageText}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Original-script text · use the{" "}
            <Link href={`/translation/${sourceId}`} className="text-primary hover:underline">
              Translation Center
            </Link>{" "}
            to add transliteration, morphological notes, and layered translations.
          </p>
        </div>
      ) : (
        /* ── Editor sees empty state with prompt ── */
        <div className="rounded-lg border border-dashed border-amber-300 dark:border-amber-700/40 p-5 text-center">
          <Languages className="h-8 w-8 mx-auto text-muted-foreground opacity-40 mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No original-language text added yet.</p>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Add original text
          </Button>
        </div>
      )}
    </section>
  );
}

// ── Save-to-project dialog ────────────────────────────────────────────────────

function SaveToProjectDialog({ sourceId }: { sourceId: number }) {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");
  const [open, setOpen] = useState(false);
  const { data: projects } = useListResearchProjects({
    query: { enabled: !!user, queryKey: getListResearchProjectsQueryKey() },
  });
  const saveSource = useSaveSource();
  const createProject = useCreateResearchProject();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!projectId) return;

    let targetProjectId = parseInt(projectId, 10);

    if (projectId === "new") {
      if (!newProjectName.trim()) return;
      try {
        const created = await createProject.mutateAsync({
          data: { title: newProjectName.trim(), description: "" }
        });
        targetProjectId = created.id;
      } catch {
        toast({ title: "Error", description: "Could not create project.", variant: "destructive" });
        return;
      }
    }

    saveSource.mutate({ projectId: targetProjectId, data: { sourceId } }, {
      onSuccess: () => {
        toast({
          title: "Saved to project",
          description: projectId === "new"
            ? `Created "${newProjectName}" and added this source.`
            : "Source added to your research project.",
        });
        setOpen(false);
        setProjectId("");
        setNewProjectName("");
        queryClient.invalidateQueries({ queryKey: ["/api/research-projects"] });
      },
      onError: () => {
        toast({
          title: "Already saved",
          description: "This source is already in that project.",
          variant: "destructive",
        });
      },
    });
  };

  const isPending = saveSource.isPending || createProject.isPending;
  const canSave = projectId && (projectId !== "new" || newProjectName.trim().length > 0);

  if (!user) {
    return (
      <Button asChild>
        <Link href="/sign-in"><BookmarkPlus className="mr-2 h-4 w-4" /> Sign in to save</Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setProjectId(""); setNewProjectName(""); } }}>
      <DialogTrigger asChild>
        <Button>
          <BookmarkPlus className="mr-2 h-4 w-4" /> Save to Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Save Source to Project</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Research Project</label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects?.map(project => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.title}
                  </SelectItem>
                ))}
                {(projects?.length ?? 0) > 0 && (
                  <div className="my-1 border-t border-border" />
                )}
                <SelectItem value="new" className="font-medium text-primary">
                  ＋ Create new project
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {projectId === "new" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">New project name</label>
              <Input
                placeholder="e.g. Jesus of Nazareth Research"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); }}
                autoFocus
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave || isPending}>
            {isPending ? "Saving..." : projectId === "new" ? "Create & Save" : "Save Source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
