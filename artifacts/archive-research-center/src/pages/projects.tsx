import { useListResearchProjects, useCreateResearchProject } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FolderGit2, FileText, Bookmark, PenTool, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function ProjectsPage() {
  const { data: projects, isLoading } = useListResearchProjects();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Research Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your active research streams, notes, and claims.</p>
        </div>
        <CreateProjectDialog />
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))
        ) : projects?.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-secondary/30 rounded-lg border border-dashed border-border">
            <FolderGit2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-serif mb-2">No active projects</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Create a research project to start saving sources, writing notes, and building claim cards.
            </p>
            <CreateProjectDialog />
          </div>
        ) : (
          projects?.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="group cursor-pointer hover:border-primary/50 transition-colors h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <FolderGit2 className="h-5 w-5 text-primary opacity-80" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors font-serif leading-tight">
                    {project.title}
                  </CardTitle>
                  {project.researcherType && (
                    <CardDescription className="font-medium text-xs uppercase tracking-wider mt-2">
                      {project.researcherType}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {project.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter className="border-t border-border pt-4 pb-4 gap-4 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5" title="Saved Sources">
                    <Bookmark className="h-3.5 w-3.5" /> {project.sourceCount}
                  </div>
                  <div className="flex items-center gap-1.5" title="Notes">
                    <PenTool className="h-3.5 w-3.5" /> {project.noteCount}
                  </div>
                  <div className="flex items-center gap-1.5" title="Claim Cards">
                    <FileText className="h-3.5 w-3.5" /> {project.claimCount}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const createProject = useCreateResearchProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!title.trim()) return;

    createProject.mutate({
      data: { title, description }
    }, {
      onSuccess: () => {
        toast({ title: "Project created" });
        setOpen(false);
        setTitle("");
        setDescription("");
        queryClient.invalidateQueries({ queryKey: ["/api/research-projects"] });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Create Research Project</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Title <span className="text-destructive">*</span></label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Origins of the Hekate Chaldean Oracles" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Briefly describe the scope of your research..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || createProject.isPending}>
            {createProject.isPending ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
