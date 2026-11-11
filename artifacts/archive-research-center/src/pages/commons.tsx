import { useListForumThreads, useCreateForumThread, useGetRecentForumActivity } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Users, Clock, Search, Plus } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function CommonsPage() {
  const [q, setQ] = useState("");
  const { data: threads, isLoading } = useListForumThreads({ q: q || undefined });
  const { data: activity } = useGetRecentForumActivity();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-8">
      <main className="flex-1 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-serif text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" /> Research Commons
            </h1>
            <p className="text-muted-foreground mt-2 text-sm max-w-xl">
              A space for scholars to debate interpretations, ask for translation help, and discuss historical methods.
            </p>
          </div>
          <CreateThreadDialog />
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search discussions..." 
            className="pl-9 bg-card border-border shadow-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>
            ))
          ) : threads?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-lg border border-border">
              No discussions found matching your criteria.
            </div>
          ) : (
            threads?.map(thread => (
              <Card key={thread.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      <span className="bg-secondary px-2 py-0.5 rounded">{thread.category}</span>
                    </div>
                    <h3 className="text-lg font-serif font-medium">
                      <Link href={`/commons/${thread.id}`} className="hover:text-primary hover:underline transition-colors">
                        {thread.title}
                      </Link>
                    </h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <span>Started by {thread.authorName}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(thread.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold bg-secondary/40 px-3 py-1.5 rounded-full border border-border">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    {thread.replyCount}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <aside className="w-full md:w-80 space-y-6 flex-shrink-0">
        <Card className="bg-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-serif">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {activity?.recentReplies.slice(0,5).map(reply => (
              <div key={reply.id} className="text-sm">
                <div className="text-xs text-muted-foreground mb-1">
                  <strong>{reply.authorName}</strong> replied:
                </div>
                <Link href={`/commons/${reply.threadId}`} className="font-medium hover:text-primary hover:underline line-clamp-2">
                  "{reply.content}"
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function CreateThreadDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Methodology");
  
  const create = useCreateForumThread();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    create.mutate({
      data: { title, content, category, authorName: "Current User" } // hardcoded author for demo
    }, {
      onSuccess: () => {
        toast({ title: "Thread posted" });
        setOpen(false);
        setTitle("");
        setContent("");
        queryClient.invalidateQueries({ queryKey: ["/api/forum/threads"] });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" /> Start Discussion</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Start a New Discussion</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Help translating a difficult Coptic phrase" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Translation, Methodology, Sources" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Initial Post</label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={6} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || !content.trim() || create.isPending}>
            Post Thread
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
