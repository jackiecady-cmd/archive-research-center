import { useListConciergePaths, useGetRecommendation } from "@workspace/api-client-react";
import { useState } from "react";
import { useConciergeProfile } from "@/store/concierge-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Compass, ArrowLeft, ArrowRight, Library } from "lucide-react";
import { Link } from "wouter";

const EXPERIENCE = [
  { value: "beginner" as const, label: "New to this", detail: "Start with how sources and confidence grades work." },
  { value: "intermediate" as const, label: "Some research already", detail: "A pathway with room to go deeper." },
  { value: "advanced" as const, label: "Experienced", detail: "Primary sources, provenance, and evidence method." },
];

export function ConciergePage() {
  const { data: paths, isLoading } = useListConciergePaths();
  const recommend = useGetRecommendation();
  const { setProfile, clearProfile } = useConciergeProfile();
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [experience, setExperience] = useState<(typeof EXPERIENCE)[number]["value"]>("intermediate");

  const result = recommend.data;

  const reset = () => {
    setPendingType(null);
    recommend.reset();
    clearProfile();
  };

  const confirm = () => {
    if (!pendingType) return;
    const path = paths?.find((item) => item.id === pendingType);
    setProfile({
      researcherType: pendingType,
      researcherLabel: path?.name ?? pendingType,
      experience,
    });
    recommend.mutate({
      data: { researcherType: pendingType, interests: [], experienceLevel: experience },
    });
  };

  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <button type="button" onClick={reset} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Choose another pathway
        </button>
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold">
            <Compass className="h-4 w-4" /> {result.path.name}
          </div>
          <h1 className="text-3xl font-serif">Where to begin</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{result.path.description}</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Next steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              {result.nextSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </CardContent>
        </Card>
        {result.suggestedCollections.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-serif text-xl">Collections</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {result.suggestedCollections.map((collection) => (
                <Link key={collection.id} href={`/collections/${collection.slug}`}>
                  <Card className="h-full hover:border-primary/40 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif">{collection.name}</CardTitle>
                      <CardDescription>{collection.subject}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{collection.description}</CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
        {result.suggestedSources.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-serif text-xl flex items-center gap-2"><Library className="h-5 w-5" /> Sources to open</h2>
            <ul className="space-y-2">
              {result.suggestedSources.map((source) => (
                <li key={source.id}>
                  <Link href={`/sources/${source.id}`} className="text-sm font-medium hover:text-primary hover:underline">
                    {source.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  if (pendingType) {
    const path = paths?.find((item) => item.id === pendingType);
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <button type="button" onClick={() => setPendingType(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <header className="space-y-2">
          <h1 className="text-3xl font-serif">{path?.name}</h1>
          <p className="text-sm text-muted-foreground">{path?.description}</p>
        </header>
        <div className="space-y-3">
          <p className="text-sm font-medium">How familiar is this kind of historical work?</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {EXPERIENCE.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setExperience(option.value)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  experience === option.value ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{option.detail}</div>
              </button>
            ))}
          </div>
        </div>
        <Button onClick={confirm} disabled={recommend.isPending}>
          {recommend.isPending ? "Preparing…" : "Show my starting point"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <header className="space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold">
          <Compass className="h-4 w-4" /> Research Concierge
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif">Choose a historical pathway</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The concierge points you at collections, sources, and a first research project. It is available to every signed-in researcher.
        </p>
      </header>
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {paths?.map((path) => (
            <button key={path.id} type="button" onClick={() => setPendingType(path.id)} className="text-left">
              <Card className="h-full hover:border-primary/40 transition-colors">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">{path.name}</CardTitle>
                  <CardDescription>{path.audience}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">{path.description}</CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
