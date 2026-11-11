import { useListConciergePaths, useGetRecommendation } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useConciergeProfile } from "@/store/concierge-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserCircle, Compass, Sparkles, ArrowRight, Library,
  ExternalLink, Dna, ArrowLeft, Download, ShieldAlert,
  FlaskConical, AlertTriangle, FileCode, Info, CheckCircle2,
  ChevronRight, Clock, Zap,
} from "lucide-react";
import { Link } from "wouter";

// ─── Genealogist wizard data ───────────────────────────────────────────────

type GenealogyStage =
  | "has-test"          // Do you already have a test?
  | "pick-provider"     // Which provider?
  | "provider-next"     // What do you want to do with it?
  | "no-test-goal"      // No test — what do you want to learn?
  | "export-guide"      // Show inline export steps
  | "testing-guide"     // Show provider recommendations
  | "family-research"   // Researching a specific person / family line
  | "dna-goal"          // Pick analysis goal → API call
  | "results";          // Recommendation results

const PROVIDERS = [
  { id: "ancestrydna", name: "AncestryDNA", note: "Best for relative matching & family trees" },
  { id: "23andme", name: "23andMe", note: "Best for haplogroups, ancestry composition & traits" },
  { id: "myheritage", name: "MyHeritage DNA", note: "Best for international & European genealogy" },
  { id: "familytreedna", name: "FamilyTreeDNA", note: "Best for Y-DNA & mtDNA paternal/maternal lines" },
  { id: "livingdna", name: "Living DNA", note: "Best for granular British Isles & European regional ancestry" },
  { id: "other", name: "Other / I'm not sure", note: "" },
];

const PROVIDER_NEXT_OPTIONS = [
  { id: "export", label: "Download my raw DNA", description: "Get step-by-step instructions to export your raw data file so you can use it with analysis tools.", icon: Download },
  { id: "analyze", label: "Analyze my DNA with free tools", description: "Choose a research goal and we'll point you to the right DNAGenics calculators and archive sources.", icon: FlaskConical },
  { id: "historical", label: "Research the historical context of my results", description: "Find archive sources explaining what the populations in your results actually were historically.", icon: Library },
];

const NO_TEST_GOALS = [
  { id: "family_research", label: "Research a specific person or family line", description: "I want to find names, dates, relationships, and original records for an ancestor or family." },
  { id: "matching", label: "Find living relatives", description: "I want to find cousins or other relatives I haven't met." },
  { id: "broad", label: "Broad ancestry overview", description: "I want a general picture of my continental or ethnic ancestry." },
  { id: "ancient", label: "Ancient & deep ancestry", description: "I want to understand prehistoric lineages: Neolithic farmers, Steppe pastoralists, hunter-gatherers." },
  { id: "paternal_maternal", label: "Paternal or maternal line (Y-DNA / mtDNA)", description: "I want to trace a specific surname line or maternal lineage deep into history." },
  { id: "regional", label: "Regional ancestry (especially European)", description: "I want granular breakdown within a region, not just broad continental estimates." },
  { id: "free_first", label: "Start with free tools first", description: "I want to explore what's available before deciding whether to purchase a test." },
];

const DNA_GOALS = [
  { id: "broad_ancestry", label: "Broad ancestry overview", description: "A general picture across continents and major population groups." },
  { id: "regional_ancestry", label: "Regional ancestry", description: "Fine-grained breakdown within a region — e.g. European sub-populations, Near Eastern components." },
  { id: "ancient_ancestry", label: "Ancient & deep ancestry", description: "Prehistoric lineages: Neolithic farmers, Steppe pastoralists, hunter-gatherers." },
  { id: "migration_patterns", label: "Migration patterns & corridors", description: "Which historical migration routes show up in my DNA." },
  { id: "kit_comparison", label: "Family kit comparison", description: "Compare my results against family members or across testing providers." },
  { id: "file_conversion", label: "Raw file upload / conversion", description: "I have raw DNA data and want to use additional analysis tools." },
];

// Compact export steps shown inline in the concierge
const INLINE_EXPORT: Record<string, { steps: string[]; mobileNote?: string; fileNote: string; fullGuideId: string }> = {
  ancestrydna: {
    steps: [
      "Sign in at ancestry.com and go to DNA in the navigation.",
      "Click your test name, then click Settings (top right).",
      "Scroll to Download or delete your DNA data and click Download DNA Data.",
      "Confirm by clicking Download — Ancestry emails you a link.",
      "Click the link in the email to download your ZIP file.",
    ],
    fileNote: "ZIP file → extract to find a TXT raw data file.",
    fullGuideId: "ancestrydna",
  },
  "23andme": {
    steps: [
      "Sign in at 23andme.com. Click your profile icon → Resources.",
      "Click Browse Raw Genotyping Data, scroll to the bottom, click Download.",
      "23andMe sends a confirmation email — click the link in it.",
      "Return to the same page once the file is ready and download the ZIP.",
    ],
    fileNote: "ZIP file → contains a TXT raw data file.",
    fullGuideId: "23andme",
  },
  myheritage: {
    steps: [
      "Sign in at myheritage.com. Click DNA → Manage DNA kits.",
      "Find your kit, click the three-dot menu (⋮) → select Download.",
      "MyHeritage emails a confirmation link — click it to authorise.",
      "Return to Manage DNA kits and download the file.",
    ],
    mobileNote: "MyHeritage currently states that raw DNA download cannot be completed on iPhone or iPad. Use a desktop or Android device.",
    fileNote: "ZIP file → contains a CSV raw data file.",
    fullGuideId: "myheritage",
  },
  familytreedna: {
    steps: [
      "Sign in at familytreedna.com. Go to Results & Tools → Autosomal DNA.",
      "Click Download Raw Data in the tools area.",
      "Alternatively: use the Autosomal DNA Results & Tools widget on your Dashboard → Data Download.",
      "Select the file and download — no email confirmation required.",
    ],
    fileNote: "Downloads directly — no email step. Usually a CSV or ZIP.",
    fullGuideId: "familytreedna",
  },
  livingdna: {
    steps: [
      "Sign in at livingdna.com. Click your account or profile menu.",
      "Select Profiles, then select your profile.",
      "Click Download and choose the Autosomal file.",
      "File downloads directly to your device.",
    ],
    fileNote: "Choose 'Autosomal file' specifically — it's the format compatible with analysis tools.",
    fullGuideId: "livingdna",
  },
  other: {
    steps: [
      "Most providers offer a raw DNA download under account settings, DNA settings, or a 'Manage DNA' section.",
      "Look for a link labelled 'Download raw data', 'Export', or 'Download DNA'.",
      "Avoid any option labelled 'Delete' — that permanently removes your data.",
    ],
    fileNote: "You are looking for a TXT, CSV, or ZIP file described as 'raw DNA data'.",
    fullGuideId: "ancestrydna",
  },
};

// Which providers to recommend per no-test goal
const TESTING_RECOMMENDATIONS: Record<string, { providers: string[]; note: string }> = {
  family_research: { providers: [], note: "For researching a specific person or family line, start with historical record services rather than DNA. See the workflow below." },
  matching: { providers: ["AncestryDNA", "23andMe", "MyHeritage DNA"], note: "These three have the largest matching databases, giving you the best chance of finding relatives." },
  broad: { providers: ["AncestryDNA", "23andMe", "MyHeritage DNA"], note: "All three provide solid broad ethnicity estimates. AncestryDNA and 23andMe are the most established for general ancestry composition." },
  ancient: { providers: ["23andMe", "FamilyTreeDNA"], note: "23andMe includes haplogroup data; FamilyTreeDNA's deep-clade Y-DNA and mtDNA tests can trace lineages back thousands of years. Combine either with DNAGenics free ancient-DNA calculators." },
  paternal_maternal: { providers: ["FamilyTreeDNA"], note: "FamilyTreeDNA is the only major provider offering dedicated Y-DNA (paternal line) and mtDNA (maternal line) tests. Essential for deep single-line research." },
  regional: { providers: ["Living DNA", "FamilyTreeDNA", "MyHeritage DNA"], note: "Living DNA has the most granular British Isles and European regional breakdown. For free regional analysis with your existing kit, DNAGenics has regional calculators." },
  free_first: { providers: [], note: "Most admixture analysis tools require a raw DNA file. DNAGenics offers 100+ free calculators, but you need to have already tested with a provider to get a raw file. The most cost-effective path is to purchase one test (AncestryDNA or 23andMe are typically the most affordable), download your raw data, and then use free tools like DNAGenics and GEDmatch for additional analysis." },
};

// ─── Analysis tool data for results view ──────────────────────────────────

const DNA_GOAL_RESOURCES: Record<string, { label: string; description: string; tools: { name: string; description: string; url: string }[]; archiveSuggestion: string }> = {
  broad_ancestry: {
    label: "Broad Ancestry Overview",
    description: "You want a general picture of your deep ancestry across continents and major population groups.",
    tools: [
      { name: "Start Free Analysis", description: "Upload your raw DNA file from any major provider. DNAGenics runs it against their calculator library and returns model-based admixture estimates.", url: "https://dnagenics.com" },
      { name: "Browse All Calculators", description: "100+ calculators covering broad continental, sub-continental, and ancient-reference models. Different models produce different outputs — that variation is informative, not a flaw.", url: "https://dnagenics.com" },
    ],
    archiveSuggestion: "Search the archive for scholarship on population genetics and ancient migration to understand what the calculator reference populations represent historically.",
  },
  regional_ancestry: {
    label: "Regional Ancestry",
    description: "You want fine-grained regional breakdowns within a broad geographic zone.",
    tools: [
      { name: "Regional Admixture Calculators", description: "DNAGenics includes calculators tuned to specific regions — European sub-populations, Near Eastern components, South Asian clines, and more.", url: "https://dnagenics.com" },
      { name: "Start Free Analysis", description: "Upload your raw file and run multiple regional models. Consistent signals across several models carry more weight than a single result.", url: "https://dnagenics.com" },
    ],
    archiveSuggestion: "Calculator labels like 'Anatolian Farmer' or 'Western Steppe Herder' correspond to specific archaeological cultures. Search the archive to understand what those populations actually were.",
  },
  ancient_ancestry: {
    label: "Ancient & Deep Ancestry",
    description: "You want to understand your deep prehistoric ancestry — Neolithic farmers, Steppe pastoralists, hunter-gatherer populations.",
    tools: [
      { name: "Ancient DNA Calculators", description: "Calculators built on ancient DNA reference panels modelling your genome against archaeologically documented prehistoric populations. Treat outputs as signals for further research, not lineage certificates.", url: "https://dnagenics.com" },
      { name: "Browse Calculators", description: "Filter for ancient-reference models. Look for calculators citing aDNA (ancient DNA) reference populations from published archaeological studies.", url: "https://dnagenics.com" },
    ],
    archiveSuggestion: "The archive contains scholarship on Yamnaya expansion, Bronze Age migrations, and the Neolithic transition. Cross-reference your ancient DNA signals with these documented historical events.",
  },
  migration_patterns: {
    label: "Migration Patterns & Corridors",
    description: "You want to trace which historical migration routes are reflected in your DNA.",
    tools: [
      { name: "Migration & Population Analysis", description: "DNAGenics tools can identify components associated with documented migration corridors — Silk Road gene flow, Indo-European expansions, Semitic movements. These are model-based signals requiring historical corroboration.", url: "https://dnagenics.com" },
      { name: "Start Free Analysis", description: "Run multiple models and look for recurring signals, especially those using ancient reference populations — these are the most useful starting points for archive research.", url: "https://dnagenics.com" },
    ],
    archiveSuggestion: "Once you identify a migration signal, search for scholarship on that specific population movement. Build a Research Project linking your DNA signals to specific sources.",
  },
  kit_comparison: {
    label: "Family Kit Comparison",
    description: "You want to compare your DNA results against family members or across providers.",
    tools: [
      { name: "Kit Comparison Tools", description: "DNAGenics allows uploading and comparing multiple kits — useful for verifying shared ancestry between known relatives or tracing which ancestral line a component comes from.", url: "https://dnagenics.com" },
      { name: "GEDmatch", description: "Cross-provider matching — compare your DNA against users who tested with any company. Essential if your relatives tested with different providers.", url: "https://www.gedmatch.com" },
    ],
    archiveSuggestion: "After identifying shared components, use the archive to research the historical populations those components represent. A consistent shared component across family kits points to a documented population.",
  },
  file_conversion: {
    label: "Raw File Upload & Conversion",
    description: "You already have raw DNA data and want to use it with additional analysis tools.",
    tools: [
      { name: "Raw DNA File Upload", description: "DNAGenics accepts raw files from AncestryDNA, 23andMe, MyHeritage, FamilyTreeDNA, and other providers. Upload once to access all 100+ calculators.", url: "https://dnagenics.com" },
      { name: "File Conversion & Imputation", description: "DNAGenics offers file conversion and imputation tools to expand your existing raw data. Imputation statistically infers additional SNPs — results are estimates, quality varies by reference panel.", url: "https://dnagenics.com" },
    ],
    archiveSuggestion: "Your raw file contains the same underlying data regardless of which reports your provider offers. DNAGenics's research-grade models are not available from most consumer providers.",
  },
};

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
  genealogist: {
    step: "On FamilySearch, search for one specific ancestor by name and birth year — note how many sources are attached versus how many tree entries have no source at all.",
    link: "/genealogy",
    linkLabel: "Genealogy & DNA Guide",
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
  const [genealogyStage, setGenealogyStage] = useState<GenealogyStage | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [noTestGoal, setNoTestGoal] = useState<string | null>(null);
  const [selectedDnaGoal, setSelectedDnaGoal] = useState<string | null>(null);

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
      if (s.selectedType)   setSelectedType(s.selectedType as string);
      if (s.pendingType)    setPendingType(s.pendingType as string);
      if (s.personalization) setPersonalization(s.personalization as PersonalizationData);
      if (s.genealogyStage) setGenealogyStage(s.genealogyStage as GenealogyStage);
      if (s.selectedProvider) setSelectedProvider(s.selectedProvider as string);
      if (s.noTestGoal)       setNoTestGoal(s.noTestGoal as string);
      if (s.selectedDnaGoal)  setSelectedDnaGoal(s.selectedDnaGoal as string);
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
        selectedType, pendingType, personalization, genealogyStage,
        selectedProvider, noTestGoal, selectedDnaGoal,
        expChoice, timeChoice, overwhelmedChoice, cachedResult,
      }));
    } catch { /* storage quota or private browsing */ }
  }, [selectedType, pendingType, personalization, genealogyStage, selectedProvider,
      noTestGoal, selectedDnaGoal, expChoice, timeChoice, overwhelmedChoice, cachedResult]);

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
    setGenealogyStage(null);
    setSelectedProvider(null);
    setNoTestGoal(null);
    setSelectedDnaGoal(null);
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
    if (typeId === "genealogist") {
      setGenealogyStage("has-test");
    } else {
      recommend.mutate({ data: { researcherType: typeId, interests: [], experienceLevel: data.experience } });
    }
  };

  const fireRecommendation = (goalId: string) => {
    setSelectedDnaGoal(goalId);
    setGenealogyStage("results");
    recommend.mutate({
      data: {
        researcherType: "genealogist",
        interests: [goalId],
        experienceLevel: "intermediate",
        // @ts-ignore – extended field accepted by API
        dnaGoal: goalId,
      }
    });
  };

  const fireHistoricalRecommendation = () => {
    setGenealogyStage("results");
    recommend.mutate({
      data: { researcherType: "genealogist", interests: [], experienceLevel: "intermediate" }
    });
  };

  // ── Personalization form ─────────────────────────────────────────────
  // Shown after a researcher type is selected, before the API fires

  if (pendingType !== null && selectedType === null) {
    const EXPERIENCE_OPTIONS: { value: PersonalizationData['experience']; label: string; sub: string }[] = [
      { value: 'beginner',     label: "I'm new to this",                  sub: "No prior experience with formal historical or genealogical research." },
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

  // ── Genealogist wizard ─────────────────────────────────────────────────

  if (selectedType === "genealogist" && genealogyStage) {

    // Step: Do you have a test?
    if (genealogyStage === "has-test") {
      return (
        <WizardShell onBack={handleReset} step="1 of 3" title="Do you already have a DNA test?">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Yes — I've been tested", sub: "I have results from AncestryDNA, 23andMe, or another provider.", action: () => setGenealogyStage("pick-provider") },
              { label: "No — I haven't tested yet", sub: "I want to find out which test to take and what I can learn.", action: () => setGenealogyStage("no-test-goal") },
              { label: "I'm researching a specific person or family line", sub: "I want to verify names, dates, and relationships across multiple record services.", action: () => setGenealogyStage("family-research") },
              { label: "Skip — explore free analysis tools", sub: "I have raw DNA data and want to run calculators.", action: () => setGenealogyStage("dna-goal") },
            ].map(opt => (
              <button key={opt.label} onClick={opt.action}
                className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                <div className="font-serif font-medium text-base mb-1 group-hover:text-primary transition-colors">{opt.label}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{opt.sub}</div>
              </button>
            ))}
          </div>
        </WizardShell>
      );
    }

    // Step: Which provider?
    if (genealogyStage === "pick-provider") {
      return (
        <WizardShell onBack={() => setGenealogyStage("has-test")} step="2 of 3" title="Which provider did you test with?">
          <div className="grid sm:grid-cols-2 gap-3">
            {PROVIDERS.map(p => (
              <button key={p.id} onClick={() => { setSelectedProvider(p.id); setGenealogyStage("provider-next"); }}
                className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                <div className="font-medium text-sm group-hover:text-primary transition-colors">{p.name}</div>
                {p.note && <div className="text-xs text-muted-foreground mt-0.5">{p.note}</div>}
              </button>
            ))}
          </div>
        </WizardShell>
      );
    }

    // Step: What do you want to do with it?
    if (genealogyStage === "provider-next" && selectedProvider) {
      const providerName = PROVIDERS.find(p => p.id === selectedProvider)?.name ?? selectedProvider;
      return (
        <WizardShell onBack={() => setGenealogyStage("pick-provider")} step="3 of 3"
          title={`You tested with ${providerName}. What would you like to do?`}>
          <div className="space-y-3">
            {PROVIDER_NEXT_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => {
                if (opt.id === "export") setGenealogyStage("export-guide");
                else if (opt.id === "analyze") setGenealogyStage("dna-goal");
                else fireHistoricalRecommendation();
              }}
                className="w-full text-left p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors group flex items-start gap-4">
                <opt.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm group-hover:text-primary transition-colors">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{opt.description}</div>
                </div>
              </button>
            ))}
          </div>
        </WizardShell>
      );
    }

    // Step: Export guide (inline)
    if (genealogyStage === "export-guide" && selectedProvider) {
      const guide = INLINE_EXPORT[selectedProvider] ?? INLINE_EXPORT["other"];
      const providerName = PROVIDERS.find(p => p.id === selectedProvider)?.name ?? selectedProvider;
      return (
        <WizardShell onBack={() => setGenealogyStage("provider-next")} step=""
          title={`Downloading your raw DNA from ${providerName}`}>
          <div className="space-y-5">
            {/* Privacy notice */}
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 flex items-start gap-3 text-xs text-red-900/80">
              <ShieldAlert className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-red-800">Privacy first</div>
                <p>Genetic data is uniquely identifying and cannot be anonymised. Review the destination site's privacy policy before uploading. Enable 2FA on all accounts. The Archive & Research Center does not receive or store your raw DNA — you download to your own device and upload directly to the service you choose.</p>
              </div>
            </div>

            {/* Download ≠ Delete warning */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 flex items-start gap-3 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span><strong>Download ≠ Delete.</strong> Follow these steps to download a copy only. Do not click any "Delete DNA" or "Remove kit" option — that permanently removes your test results.</span>
            </div>

            {guide.mobileNote && (
              <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4 flex items-start gap-3 text-xs text-sky-800">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{guide.mobileNote}</span>
              </div>
            )}

            {/* Steps */}
            <ol className="space-y-3">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span className="text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            <div className="flex items-start gap-2 bg-secondary/40 border border-border rounded-md p-3 text-xs text-muted-foreground">
              <FileCode className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary" />
              <span>{guide.fileNote}</span>
            </div>

            {/* What next */}
            <div className="rounded-xl border border-emerald-700/20 bg-emerald-950/5 p-5 space-y-3">
              <div className="font-serif font-medium text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Once you have your file, take it to:
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { name: "DNAGenics", desc: "100+ free admixture calculators", url: "https://dnagenics.com" },
                  { name: "GEDmatch", desc: "Cross-provider relative matching", url: "https://www.gedmatch.com" },
                  { name: "Living DNA (upload)", desc: "Free regional European analysis", url: "https://livingdna.com" },
                ].map(svc => (
                  <a key={svc.name} href={svc.url} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col gap-1 p-3 rounded-lg border border-border bg-card hover:border-emerald-700/40 transition-colors group">
                    <div className="font-medium text-sm group-hover:text-emerald-800 transition-colors">{svc.name} <ExternalLink className="inline h-3 w-3" /></div>
                    <div className="text-xs text-muted-foreground">{svc.desc}</div>
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/genealogy">Full Genealogy & DNA Guide <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setGenealogyStage("dna-goal")}>
                Now analyze my DNA with free tools
              </Button>
            </div>
          </div>
        </WizardShell>
      );
    }

    // Step: Researching a specific person or family line
    if (genealogyStage === "family-research") {
      return (
        <WizardShell onBack={() => setGenealogyStage("has-test")} step=""
          title="Researching a specific person or family line">
          <div className="space-y-5">
            {/* Guiding principle */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 leading-relaxed">
              <div className="font-semibold mb-1">The two-source rule</div>
              <p>
                Verify every name, date, place, and relationship against at least two independent original
                records before treating it as fact. A single "hint" from one service — or an entry in a
                user-submitted tree — is a lead, not evidence. Trees can contain errors introduced by
                well-meaning contributors; always trace the claim back to an original document.
              </p>
            </div>

            {/* Source quality hierarchy */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prefer records in this order</div>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                {[
                  { level: "1 · Strongest", label: "Original records", eg: "Census page, baptism register, ship manifest, death certificate", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
                  { level: "2 · Good", label: "Derivative records", eg: "Published transcriptions of originals, official vital-records indexes", color: "bg-sky-50 border-sky-200 text-sky-800" },
                  { level: "3 · Lead only", label: "User-submitted trees", eg: "FamilySearch collaborative tree, Ancestry member trees — without sources attached", color: "bg-amber-50 border-amber-200 text-amber-800" },
                  { level: "4 · Weakest", label: "Unsourced hints", eg: "Automated hints based solely on other users' unsourced trees", color: "bg-red-50 border-red-200 text-red-800" },
                ].map(r => (
                  <div key={r.level} className={`rounded-lg border p-3 ${r.color}`}>
                    <div className="font-bold uppercase tracking-wider text-[10px] mb-0.5 opacity-70">{r.level}</div>
                    <div className="font-semibold">{r.label}</div>
                    <div className="opacity-75 leading-relaxed mt-0.5">{r.eg}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FamilySearch warning */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="font-semibold text-sm">About the FamilySearch collaborative tree</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                FamilySearch is the largest <strong>free</strong> genealogical record service worldwide, funded by
                The Church of Jesus Christ of Latter-day Saints and open to everyone. Its record collection is
                extraordinary. However, its shared family tree is user-editable and frequently contains errors —
                unsourced connections, duplicate entries, and incorrect parents added by well-meaning contributors.
                Before accepting any relationship from the FamilySearch tree as fact, click the{" "}
                <strong>Sources</strong> tab on any person to see attached original documents, and check the{" "}
                <strong>History / Changes</strong> tab to see who added the relationship and when.
              </p>
            </div>

            {/* Three-service workflow */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cross-check the same person on all three</div>
              <div className="grid sm:grid-cols-3 gap-2">
                {[
                  {
                    name: "FamilySearch",
                    url: "https://www.familysearch.org",
                    badge: "Free",
                    badgeColor: "bg-emerald-100 text-emerald-800",
                    note: "Start here — check Sources & History tabs",
                    border: "border-emerald-700/30 bg-emerald-950/5",
                  },
                  {
                    name: "Ancestry",
                    url: "https://www.ancestry.com/search/",
                    badge: "Subscription",
                    badgeColor: "bg-sky-100 text-sky-800",
                    note: "Primary cross-check — filter by record type, not just hints",
                    border: "border-border bg-card",
                  },
                  {
                    name: "MyHeritage",
                    url: "https://www.myheritage.com/research",
                    badge: "Free + Paid",
                    badgeColor: "bg-violet-100 text-violet-800",
                    note: "Add when international or results conflict",
                    border: "border-border bg-card",
                  },
                ].map(svc => (
                  <a key={svc.name} href={svc.url} target="_blank" rel="noopener noreferrer"
                    className={`block rounded-lg border p-3 hover:opacity-80 transition-opacity ${svc.border}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm">{svc.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${svc.badgeColor}`}>{svc.badge}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{svc.note}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* Record-findings prompt */}
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
              <div className="text-sm font-semibold">Record conflicts and findings in the archive</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use <strong>Research Projects</strong> to track your work on a family line, and{" "}
                <strong>Claim Cards</strong> to document specific relationship claims (e.g. "John Smith b. 1832
                is the father of Mary Smith b. 1855"). Attach supporting evidence from original records, and
                mark conflicting tree entries as contested sources — exactly the same epistemic standard used
                for historical and theological claims throughout the archive.
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="/projects" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
                  Open Research Projects
                </a>
                <a href="/claim-cards" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-secondary/50 transition-colors text-foreground font-medium">
                  Create a Claim Card
                </a>
                <a href="/genealogy#crosscheck" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-secondary/50 transition-colors text-foreground font-medium">
                  Full cross-check guide →
                </a>
              </div>
            </div>
          </div>
        </WizardShell>
      );
    }

    // Step: No test — what do you want to learn?
    if (genealogyStage === "no-test-goal") {
      return (
        <WizardShell onBack={() => setGenealogyStage("has-test")} step="2 of 3"
          title="What are you hoping to learn from DNA research?">
          <div className="grid sm:grid-cols-2 gap-3">
            {NO_TEST_GOALS.map(g => (
              <button key={g.id} onClick={() => { setNoTestGoal(g.id); setGenealogyStage("testing-guide"); }}
                className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                <div className="font-medium text-sm group-hover:text-primary transition-colors">{g.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{g.description}</div>
              </button>
            ))}
          </div>
        </WizardShell>
      );
    }

    // Step: Testing guidance
    if (genealogyStage === "testing-guide" && noTestGoal) {
      const rec = TESTING_RECOMMENDATIONS[noTestGoal] ?? TESTING_RECOMMENDATIONS["broad"];
      const goalLabel = NO_TEST_GOALS.find(g => g.id === noTestGoal)?.label ?? noTestGoal;
      return (
        <WizardShell onBack={() => setGenealogyStage("no-test-goal")} step="" title={`Recommended path for: ${goalLabel}`}>
          <div className="space-y-6">
            <div className="bg-secondary/30 border border-border rounded-xl p-5 text-sm text-muted-foreground leading-relaxed">
              {rec.note}
            </div>

            {rec.providers.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-base font-serif font-medium">Suggested testing providers</h3>
                {rec.providers.map(name => {
                  const p = [
                    { name: "AncestryDNA", url: "https://www.ancestry.com/dna/" },
                    { name: "23andMe", url: "https://www.23andme.com/" },
                    { name: "MyHeritage DNA", url: "https://www.myheritage.com/dna" },
                    { name: "FamilyTreeDNA", url: "https://www.familytreedna.com/" },
                    { name: "Living DNA", url: "https://livingdna.com/" },
                  ].find(x => x.name === name);
                  return p ? (
                    <a key={name} href={p.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors group">
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">{name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        View current pricing <ExternalLink className="h-3 w-3" />
                      </div>
                    </a>
                  ) : null;
                })}
              </div>
            ) : null}

            <div className="rounded-xl border border-emerald-700/20 bg-emerald-950/5 p-5 space-y-2">
              <div className="font-medium text-sm flex items-center gap-2">
                <Dna className="h-4 w-4 text-emerald-700" /> Free analysis without a new test
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you already have raw DNA data from any provider, DNAGenics offers 100+ free admixture
                calculators — no new test required. Most analysis tools need a raw DNA file, so getting
                tested first is the recommended starting point.
              </p>
              <a href="https://dnagenics.com" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="mt-2 border-emerald-700/30 text-emerald-800 hover:bg-emerald-900/10 gap-2">
                  Open DNAGenics <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link href="/genealogy">Full Genealogy & DNA Guide <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/archive">Search the Archive</Link>
              </Button>
            </div>
          </div>
        </WizardShell>
      );
    }

    // Step: DNA goal → API call
    if (genealogyStage === "dna-goal") {
      return (
        <WizardShell onBack={() => {
          if (selectedProvider) setGenealogyStage("provider-next");
          else setGenealogyStage("has-test");
        }} step="" title="What is your primary DNA research goal?">
          <p className="text-sm text-muted-foreground mb-6">
            Your answer lets us point you to the most relevant DNAGenics calculators and archive sources.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {DNA_GOALS.map(g => (
              <button key={g.id} onClick={() => fireRecommendation(g.id)}
                className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                <div className="font-serif font-medium text-base mb-1 group-hover:text-primary transition-colors">{g.label}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{g.description}</div>
              </button>
            ))}
          </div>
        </WizardShell>
      );
    }

    // Loading
    if ((genealogyStage === "results" || recommend.isPending) && !recommend.isSuccess) {
      return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
          <Compass className="h-16 w-16 text-primary mx-auto opacity-50 animate-spin" style={{ animationDuration: "3s" }} />
          <h2 className="text-2xl font-serif">Curating your research pathway...</h2>
          <p className="text-muted-foreground">Pulling relevant collections and sources.</p>
        </div>
      );
    }

    // Results
    if (genealogyStage === "results" && resultData) {
      const { path, suggestedCollections, nextSteps } = resultData;
      const dnaResources = selectedDnaGoal ? DNA_GOAL_RESOURCES[selectedDnaGoal] ?? null : null;
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
                {QUICK_ACTIONS["genealogist"]?.step ?? (displayedSteps[0] || "Search for one specific ancestor on FamilySearch — check the Sources tab before trusting any tree entry.")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="sm">
                  <Link href="/genealogy">Genealogy & DNA Guide <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
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

          {dnaResources && (
            <section className="rounded-xl border border-emerald-700/30 bg-emerald-950/5 p-6 space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary border border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <ExternalLink className="h-3 w-3" /> External Resource · Third-Party
                  </div>
                  <h2 className="text-xl font-serif flex items-center gap-2 mt-1">
                    <Dna className="h-5 w-5 text-emerald-700" /> DNAGenics — {dnaResources.label}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-2xl">{dnaResources.description}</p>
                </div>
                <a href="https://dnagenics.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-emerald-700/30 text-emerald-800 hover:bg-emerald-900/10 gap-2 flex-shrink-0">
                    Open DNAGenics <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {dnaResources.tools.map((tool, i) => (
                  <a key={i} href={tool.url} target="_blank" rel="noopener noreferrer"
                    className="block p-4 rounded-lg border border-border bg-card hover:border-emerald-700/40 transition-colors group">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium text-sm group-hover:text-emerald-800 transition-colors">{tool.name}</div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
                  </a>
                ))}
              </div>
              <div className="bg-background border border-border rounded-lg p-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground block mb-1">Using results with the archive:</span>
                {dnaResources.archiveSuggestion}
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-4">
                DNAGenics is independent. The Archive has no affiliation or endorsement arrangement with them. Admixture results are model-based ancestry signals for research purposes — not identity certificates or medical diagnoses.
              </p>
            </section>
          )}

          <div className="grid md:grid-cols-2 gap-10">
            {suggestedCollections.length > 0 && (
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
            )}
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
                  <Link href="/genealogy">Full Genealogy & DNA Guide <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // ── Non-genealogist loading / results ───────────────────────────────────

  if (selectedType && selectedType !== "genealogist" && recommend.isPending) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
        <Compass className="h-16 w-16 text-primary mx-auto opacity-50 animate-spin" style={{ animationDuration: "3s" }} />
        <h2 className="text-2xl font-serif">Curating your research pathway...</h2>
        <p className="text-muted-foreground">Pulling relevant collections and sources.</p>
      </div>
    );
  }

  if (selectedType && selectedType !== "genealogist" && resultData) {
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

// ─── Shared wizard shell ───────────────────────────────────────────────────

function WizardShell({ children, onBack, step, title }: {
  children: React.ReactNode;
  onBack: () => void;
  step: string;
  title: string;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step && <span className="text-xs text-muted-foreground font-medium">{step}</span>}
      </div>
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold">
          <Dna className="h-4 w-4" /> Genealogist Pathway
        </div>
        <h1 className="text-2xl font-serif">{title}</h1>
      </header>
      {children}
    </div>
  );
}
