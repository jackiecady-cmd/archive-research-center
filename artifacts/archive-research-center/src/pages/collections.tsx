import { useListCollections } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BookMarked, ArrowRight } from "lucide-react";

export function CollectionsPage() {
  const { data: collections, isLoading } = useListCollections();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-serif text-foreground">Curated Collections</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Thematic repositories assembled by our resident scholars. These collections gather primary sources, 
          translations, and critical scholarship around specific figures, periods, or historical currents.
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))
        ) : (
          collections?.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.slug}`}>
              <Card className="group cursor-pointer hover:border-primary/50 transition-colors h-full flex flex-col relative overflow-hidden">
                {collection.featured && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                    Flagship
                  </div>
                )}
                <CardHeader>
                  <BookMarked className="h-6 w-6 text-muted-foreground mb-2" />
                  <CardTitle className="text-xl group-hover:text-primary transition-colors font-serif">
                    {collection.name}
                  </CardTitle>
                  <CardDescription className="font-medium text-primary/80">
                    {collection.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-4 leading-relaxed">
                    {collection.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-semibold text-foreground bg-secondary px-2.5 py-1 rounded">
                      {collection.sourceCount} Sources
                    </span>
                    <span className="text-primary text-sm flex items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      Explore <ArrowRight className="ml-1 h-4 w-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
