import { useListClaimCards } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClaimStatusBadge } from "@/pages/project-detail";
import { FileText, ArrowRight } from "lucide-react";

export function ClaimCardsPage() {
  const { data: claims, isLoading } = useListClaimCards();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl font-serif text-foreground mb-3">Claim Cards</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          An epistemic ledger. Track historical and theological claims across your projects, and weigh the evidence for each.
        </p>
      </header>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : claims?.length === 0 ? (
        <div className="text-center py-20 bg-secondary/30 rounded-lg border border-dashed border-border">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-serif mb-1">No claims recorded</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
            You haven't created any claim cards yet. Create them from within a Research Project.
          </p>
          <Link href="/projects" className="text-primary hover:underline font-medium text-sm">Go to Projects &rarr;</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {claims?.map((claim) => (
            <Link key={claim.id} href={`/claim-cards/${claim.id}`}>
              <Card className="h-full group hover:border-primary/50 transition-colors flex flex-col cursor-pointer">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex justify-between items-start mb-2">
                    <ClaimStatusBadge status={claim.status} />
                    <span className="text-xs text-muted-foreground font-medium flex items-center">
                      <FileText className="h-3 w-3 mr-1" /> {claim.evidenceCount} sources
                    </span>
                  </div>
                  <CardTitle className="text-xl font-serif group-hover:text-primary transition-colors">
                    {claim.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col">
                  <p className="text-sm font-medium italic text-foreground/80 leading-relaxed line-clamp-3 mb-4 flex-1">
                    "{claim.claim}"
                  </p>
                  <div className="text-xs text-primary/70 font-semibold uppercase tracking-wider flex items-center self-end opacity-0 group-hover:opacity-100 transition-opacity">
                    View Evidence Trail <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
