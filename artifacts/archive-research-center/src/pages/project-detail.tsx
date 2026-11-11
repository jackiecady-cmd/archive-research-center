import { useParams } from "wouter";
import { useGetResearchProject, getGetResearchProjectQueryKey, useCreateNote, useCreateClaimCard, useRemoveSavedSource } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark, PenTool, FileText, Trash2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { SourceTypeBadge, ConfidenceBadge } from "@/components/source-badges";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export function ProjectDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data, isLoading } = useGetResearchProject(id, { query: { enabled: !!id, queryKey: getGetResearchProjectQueryKey(id) } });

  if (isLoading) {
    return <div className="p-12"><Skeleton className="h-64 w-full" /></div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Project not found.</div>;
  }

  const { project, savedSources, notes, claimCards } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Link href="/projects" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <header className="bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-3">
            <h1 className="text-3xl font-serif font-medium">{project.title}</h1>
            <p className="text-muted-foreground max-w-3xl leading-relaxed">{project.description}</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="sources" className="gap-2"><Bookmark className="h-4 w-4" /> Saved Sources ({savedSources.length})</TabsTrigger>
          <TabsTrigger value="notes" className="gap-2"><PenTool className="h-4 w-4" /> Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="claims" className="gap-2"><FileText className="h-4 w-4" /> Claim Cards ({claimCards.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          {savedSources.length === 0 ? (
            <div className="text-center py-16 bg-secondary/20 rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground mb-4">No sources saved to this project yet.</p>
              <Button asChild variant="outline"><Link href="/archive">Search Archive</Link></Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {savedSources.map(ss => (
                <Card key={ss.id} className="relative group">
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <RemoveSourceButton projectId={project.id} savedSourceId={ss.id} />
                  </div>
                  <CardHeader className="pb-3 pr-12">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {ss.source && <SourceTypeBadge type={ss.source.sourceType} />}
                      {ss.source && <ConfidenceBadge confidence={ss.source.confidence} />}
                    </div>
                    <CardTitle className="text-lg font-serif">
                      <Link href={`/sources/${ss.sourceId}`} className="hover:underline">{ss.source?.title || 'Unknown Source'}</Link>
                    </CardTitle>
                  </CardHeader>
                  {ss.userNotes && (
                    <CardContent>
                      <div className="text-sm bg-secondary/30 p-3 rounded border border-border/50">
                        <span className="font-semibold block mb-1 text-xs uppercase tracking-wider text-muted-foreground">My Note</span>
                        {ss.userNotes}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-end">
            <CreateNoteDialog projectId={project.id} />
          </div>
          {notes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-secondary/10">No notes yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {notes.map(note => (
                <Card key={note.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <CardDescription className="text-xs">Created {new Date(note.createdAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">{note.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <div className="flex justify-end">
             <CreateClaimCardDialog projectId={project.id} />
          </div>
          {claimCards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-secondary/10">No claim cards yet.</div>
          ) : (
            <div className="grid gap-4">
              {claimCards.map(claim => (
                <Card key={claim.id} className="hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg font-serif"><Link href={`/claim-cards/${claim.id}`} className="hover:underline">{claim.title}</Link></CardTitle>
                      <ClaimStatusBadge status={claim.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/90 font-medium italic mb-4">"{claim.claim}"</p>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" /> {claim.evidenceCount} Pieces of Evidence
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RemoveSourceButton({ projectId, savedSourceId }: { projectId: number, savedSourceId: number }) {
  const remove = useRemoveSavedSource();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={() => {
        if(confirm("Remove this source from the project?")) {
          remove.mutate({ projectId, id: savedSourceId }, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getGetResearchProjectQueryKey(projectId) });
              toast({ title: "Source removed" });
            }
          });
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function CreateNoteDialog({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  const create = useCreateNote();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    create.mutate({
      projectId,
      data: { title, content }
    }, {
      onSuccess: () => {
        toast({ title: "Note created" });
        setOpen(false);
        setTitle("");
        setContent("");
        queryClient.invalidateQueries({ queryKey: getGetResearchProjectQueryKey(projectId) });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><PenTool className="h-4 w-4 mr-2" /> Add Note</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="Note Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Note Content..." rows={6} value={content} onChange={e => setContent(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || !content.trim() || create.isPending}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateClaimCardDialog({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [claim, setClaim] = useState("");
  const [status, setStatus] = useState<"supported" | "contested" | "uncertain" | "refuted">("uncertain");
  
  const create = useCreateClaimCard();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!title.trim() || !claim.trim()) return;
    create.mutate({
      data: { title, claim, status, projectId }
    }, {
      onSuccess: () => {
        toast({ title: "Claim Card created" });
        setOpen(false);
        setTitle("");
        setClaim("");
        setStatus("uncertain");
        queryClient.invalidateQueries({ queryKey: getGetResearchProjectQueryKey(projectId) });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><FileText className="h-4 w-4 mr-2" /> New Claim Card</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Claim Card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Topic / Short Title</label>
            <Input placeholder="e.g. Authorship of Q" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">The Claim</label>
            <Textarea placeholder="State the specific claim..." rows={3} value={claim} onChange={e => setClaim(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Status</label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncertain">Uncertain</SelectItem>
                <SelectItem value="supported">Supported</SelectItem>
                <SelectItem value="contested">Contested</SelectItem>
                <SelectItem value="refuted">Refuted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || !claim.trim() || create.isPending}>Create Claim</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClaimStatusBadge({ status }: { status: string }) {
  const styles: any = {
    supported: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
    contested: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    uncertain: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
    refuted: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400"
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${styles[status]}`}>{status}</span>;
}
