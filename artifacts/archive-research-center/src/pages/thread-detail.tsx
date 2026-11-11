import { useParams, Link } from "wouter";
import { useGetForumThread, getGetForumThreadQueryKey, useCreateForumReply } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, UserCircle2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function ThreadDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data, isLoading } = useGetForumThread(id, { query: { enabled: !!id, queryKey: getGetForumThreadQueryKey(id) } });

  const createReply = useCreateForumReply();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [replyContent, setReplyContent] = useState("");

  if (isLoading) return <div className="max-w-4xl mx-auto p-12"><Skeleton className="h-64 w-full" /></div>;
  if (!data) return <div className="p-12 text-center">Thread not found.</div>;

  const { thread, replies } = data;

  const handleReply = () => {
    if (!replyContent.trim()) return;
    createReply.mutate({
      threadId: id,
      data: { content: replyContent, authorName: "Current User" }
    }, {
      onSuccess: () => {
        setReplyContent("");
        toast({ title: "Reply posted" });
        queryClient.invalidateQueries({ queryKey: getGetForumThreadQueryKey(id) });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link href="/commons" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Commons
      </Link>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-4">
          <div className="flex gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-1 rounded text-muted-foreground">
              {thread.category}
            </span>
          </div>
          <h1 className="text-3xl font-serif">{thread.title}</h1>
          
          <div className="flex flex-wrap items-center gap-3 pt-2 text-sm border-b border-border pb-6">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <UserCircle2 className="h-5 w-5" /> {thread.authorName}
            </div>
            <span className="text-muted-foreground sm:px-2 sm:border-l sm:border-border">
              {new Date(thread.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="pt-4 prose prose-stone dark:prose-invert max-w-none text-foreground/90 font-serif leading-relaxed">
            {thread.content?.split('\n').map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <h3 className="text-lg font-serif flex items-center gap-2 border-b border-border pb-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" /> {replies.length} Replies
        </h3>
        
        <div className="space-y-4">
          {replies.map(reply => (
            <Card key={reply.id} className="bg-secondary/10 border-border/60">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                    {reply.authorName}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reply.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm leading-relaxed text-foreground/80 font-serif">
                  {reply.content.split('\n').map((para, i) => <p key={i} className={i>0?"mt-2":""}>{para}</p>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-secondary/30 border border-border p-6 rounded-xl mt-8">
          <h4 className="font-medium mb-4">Write a reply</h4>
          <Textarea 
            rows={5} 
            placeholder="Contribute to the discussion..." 
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            className="mb-4 bg-background"
          />
          <div className="flex justify-end">
            <Button onClick={handleReply} disabled={!replyContent.trim() || createReply.isPending}>
              {createReply.isPending ? "Posting..." : "Post Reply"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
