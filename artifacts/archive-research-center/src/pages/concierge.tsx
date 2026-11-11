import { useListConciergePaths, useGetRecommendation } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useConciergeProfile } from "@/store/concierge-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserCircle, Compass, Sparkles, ArrowRight, Library,
  ArrowLeft, CheckCircle2, Clock, Zap,
} from "lucide-react";
import { Link } from "wouter";

// ─── Personalization data ─────────────────────────────────────────────────

type PersonalizationData = {
  experience: 'beginner' | 'intermediate' | 'advanced';
  time: '15min' | '1hour' | 'open';
  overwhelmed: boolean;
};

const QUICK_ACTIONS: Record<string, { step: string; link: string; linkLabel: string }> = {
  beginner: {
    step: "Open one collection and read the provenance note on a single primary source — understanding how confidence is graded is the most valuable 15 minutes before diving in.",
    link: "/collections",
    linkLabel: "Browse Collections",
  },
  pastor: {
    step: "Open the Jesus of Nazareth collection and find one primary source — read its provenance summary and note what separates it from secondary scholarship.",
    link: "/collections/jesus-of-nazareth",
    linkLabel: "Jesus of Nazareth Collection",
  },
  translator: {
    step: "Search the archive for a text in your working language and open its full record — read the translation lineage and original-language sections.",
    link: "/archive",
    linkLabel: "Search the Archive",
  },
  archaeologist: {
    step: "Open one primary source and trace its provenance chain from excavation context to current repository location — this is the core skill of the archive.",
    link: "/archive",
    linkLabel: "Search the Archive",
  },
  occult_researcher: {
    step: "Open the Hekate Anthology collection and read the confidence rating on one primary source — see how the archive grades evidence before exploring content.",
    link: "/collections/hekate",
    linkLabel: "Hekate Anthology",
  },
};

const STORAGE_KEY = "arc_concierge_v1";

// ─── Main component ────────────────────────────────────────────────────────

export function ConciergePage() {
  const { data: paths, isLoading } = useListConciergePaths();
  const recommend = useGetRecommendation();

  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Personalization wizard state
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [personalization, setPersonalization] = useState<PersonalizationData | null>(null);
  const [expChoice, setExpChoice] = useState<PersonalizationData['experience']>('intermediate');
  const [timeChoice, setTimeChoice] = useState<PersonalizationData['time']>('1hour');
  const [overwhelmedChoice, setOverwhelmedChoice] = useState(false);

  // Cached API result — survives navigation so results reappear on Back
  const [cachedResult, setCachedResult] = useState<typeof recommend.data | null>(null);

  const { setProfile, clearProfile } = useConciergeProfile();

  // ── Session-storage persistence ───────────────────────────────────────────

  useEffect(() => {
    // Restore wizard state on mount (user navigated away and came back)
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Record<string, unknown>;
      const knownTypes = ["beginner", "pastor", "translator", "archaeologist", "occult", "historian"];
      const storedType = s.selectedType ?? s.pendingType;
      if (typeof storedType === "string" && !knownTypes.includes(storedType)) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      if (s.selectedType)   setSelectedType(s.selectedType as string);
      if (s.pendingType)    setPendingType(s.pendingType as string);
      if (s.personalization) setPersonalization(s.personalization as PersonalizationData);
      if (s.expChoice)  setExpChoice(s.expChoice as PersonalizationData['experience']);
      if (s.timeChoice) setTimeChoice(s.timeChoice as PersonalizationData['time']);
      if (typeof s.overwhelmedChoice === 'boolean') setOverwhelmedChoice(s.overwhelmedChoice);
      if (s.cachedResult) setCachedResult(s.cachedResult as typeof recommend.data);
    } catch { /* malformed or unavailable */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Persist to sessionStorage on every relevant state change
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedType, pendingType, personalization,
        expChoice, timeChoice, overwhelmedChoice, cachedResult,
      }));
    } catch { /* storage quota or private browsing */ }
  }, [selectedType, pendingType, personalization,
      expChoice, timeChoice, overwhelmedChoice, cachedResult]);

  useEffect(() => {
    // Cache the live API result so it survives unmount/remount
    if (recommend.isSuccess && recommend.data) setCachedResult(recommend.data);
  }, [recommend.isSuccess, recommend.data]);

  // Merge: live result takes priority; fall back to cached if user navigated away
  const resultData = recommend.data ?? cachedResult;

  const handleReset = () => {
    setSelectedType(null);
    setPendingType(null);
    setPersonalization(null);
    setExpChoice('intermediate');
    setTimeChoice('1hour');
    setOverwhelmedChoice(false);
    setCachedResult(null);
    recommend.reset();
    clearProfile();
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const handleConfirmPersonalization = () => {
    const data: PersonalizationData = { experience: expChoice, time: timeChoice, overwhelmed: overwhelmedChoice };
    setPersonalization(data);
    const typeId = pendingType!;
    setSelectedType(typeId);
    setPendingType(null);
    // Publish the completed profile so Archive Search can personalise
    setProfile({
      researcherType: typeId,
      researcherLabel: paths?.find((p) => p.id === typeId)?.name ?? typeId,
      experience: data.experience,
    });
    recommend.mutate({ data: { researcherType: typeId, interests: [], experienceLevel: data.experience } });
  };

  // ── Personalization form ─────────────────────────────────────────────
  // Shown after a researcher type is selected, before the API fires

  if (pendingType !== null && selectedType === null) {
    const EXPERIENCE_OPTIONS: { value: PersonalizationData['experience']; label: string; sub: string }[] = [
      { value: 'beginner',     label: "I'm new to this",                  sub: "No prior experience with formal historical research." },
      { value: 'intermediate', label: "I've done some research before",    sub: "Familiar with basic concepts — looking to go deeper." },
      { value: 'advanced',     label: "Experienced researcher",            sub: "Comfortable with primary sources, provenance, and evidence methodology." },
    ];
    const TIME_OPTIONS: { value: PersonalizationData['time']; label: string; sub: string }[] = [
      { value: '15min', label: "About 15 minutes",  sub: "Give me one clear, achievable next step — nothing more." },
      { value: '1hour', label: "About an hour",      sub: "I have time to explore a pathway in depth." },
      { value: 'open',  label: "Open-ended",         sub: "I'm diving deep and have no time constraint right now." },
    ];

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <button onClick={() => setPendingType(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-xs text-muted-foreground font-medium">Personalise your pathway</span>
        </div>

        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold">
            <Compass className="h-4 w-4" /> A few quick questions
          </div>
          <h1 className="text-2xl font-serif">Tell us a bit about yourself</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your answers let us tailor the starting point, adjust the level of detail, and — if you only have
            15 minutes — give you exactly one clear next step.
          </p>
        </header>

        <div className="space-y-8">
          {/* Experience level */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">What's your experience level with historical research?</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {EXPERIENCE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setExpChoice(opt.value)}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    expChoice === opt.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                  }`}>
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Available time */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">How much time do you have right now?</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {TIME_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setTimeChoice(opt.value)}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    timeChoice === opt.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                  }`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {opt.value === '15min' && <Clock className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                    <div className="font-medium text-sm">{opt.label}</div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Overwhelmed toggle */}
          <button
            className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
              overwhelmedChoice ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:border-primary/40'
            }`}
            onClick={() => setOverwhelmedChoice(!overwhelmedChoice)}>
            <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
              overwhelmedChoice ? 'bg-primary border-primary' : 'border-border'
            }`}>
              {overwhelmedChoice && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
            </div>
            <div>
              <div className="text-sm font-medium">I'm feeling a bit overwhelmed — give me a simplified path</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                We'll reduce the number of suggestions and present each step clearly — one thing at a time.
              </div>
            </div>
          </button>
        </div>

        <Button onClick={handleConfirmPersonalization} size="lg" className="w-full sm:w-auto gap-2">
          {timeChoice === '15min'
            ? <><Zap className="h-4 w-4" /> Give me my 15-minute next step</>
            : <><Sparkles className="h-4 w-4" /> Get my research pathway</>
          }
        </Button>
      </div>
    );
  }

  // ── Loading / results ───────────────────────────────────────────────────

  if (selectedType && recommend.isPending) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
        <Compass className="h-16 w-16 text-primary mx-auto opacity-50 animate-spin" style={{ animationDuration: "3s" }} />
        <h2 className="text-2xl font-serif">Curating your research pathway...</h2>
        <p className="text-muted-foreground">Pulling relevant collections and sources.</p>
      </div>
    );
  }

  if (selectedType && resultData) {
    const { path, suggestedCollections, nextSteps } = resultData;
    const displayedSteps = personalization?.overwhelmed ? (nextSteps as string[]).slice(0, 3) : (nextSteps as string[]);
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <header className="text-center space-y-4 border-b border-border pb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full text-primary mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif">Your Research Pathway</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">{path.description}</p>
          <Button variant="outline" onClick={handleReset} className="text-xs">Start Over</Button>
        </header>

        {/* 15-min quick action */}
        {personalization?.time === '15min' && (
          <section className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Your 15-minute next step</span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-foreground font-medium">
              {QUICK_ACTIONS[selectedType!]?.step ?? (displayedSteps[0] || "Open one collection and read the provenance note on a single primary source.")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm">
                <Link href={QUICK_ACTIONS[selectedType!]?.link ?? "/archive"}>
                  {QUICK_ACTIONS[selectedType!]?.linkLabel ?? "Start"} <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">Start over</Button>
            </div>
          </section>
        )}

        {personalization?.overwhelmed && (
          <div className="bg-secondary/30 border border-border rounded-lg px-4 py-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Simplified path enabled.</span>{" "}
            {personalization.time === '15min'
              ? "Your 15-minute step is above. Come back when you have more time to explore the full pathway."
              : "We've limited suggestions to the three most important next steps. Explore more whenever you're ready."}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <h2 className="text-xl font-serif flex items-center gap-2">
              <Library className="h-5 w-5 text-primary" /> Suggested Collections
            </h2>
            {suggestedCollections.map((c: any) => (
              <Card key={c.id} className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base"><Link href={`/collections/${c.slug}`} className="hover:underline">{c.name}</Link></CardTitle>
                  <CardDescription>{c.subject}</CardDescription>
                </CardHeader>
                <CardContent><p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p></CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-serif flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" /> Recommended Next Steps
            </h2>
            <ul className="space-y-3">
              {displayedSteps.map((step: string, i: number) => (
                <li key={i} className="flex gap-3 items-start bg-secondary/20 p-4 rounded-lg border border-border">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4 border-t border-border">
              <Button asChild className="w-full h-11">
                <Link href="/projects">Create a Research Project <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Path selection ─────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <header className="text-center space-y-4 max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-serif text-foreground">Research Concierge</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Tell us what kind of research you are undertaking and we will configure a custom starting
          point, highlight relevant collections, and suggest methodologies.
        </p>
      </header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : (
          paths?.map(path => (
            <Card key={path.id}
              className="cursor-pointer hover:border-primary/60 transition-colors group relative overflow-hidden"
              onClick={() => setPendingType(path.id)}>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center text-primary mb-4 border border-border">
                  <UserCircle className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-serif group-hover:text-primary transition-colors">{path.name}</CardTitle>
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">For: {path.audience}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{path.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
