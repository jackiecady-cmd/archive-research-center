import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GitBranch, ExternalLink, Dna, FlaskConical, Globe, Mountain,
  MapPin, ArrowRightLeft, FileCode, AlertTriangle, Search,
  BookOpen, ClipboardList, Info, Download, ShieldAlert,
  Users, TreePine, Microscope, ChevronRight,
  GitMerge, CheckSquare, Flag, ScrollText, Scale,
} from "lucide-react";
import { Link } from "wouter";

// ─── Provider directory ────────────────────────────────────────────────────

const PROVIDERS = [
  {
    id: "ancestrydna",
    name: "AncestryDNA",
    tagline: "Best for relative matching and family-tree research",
    description:
      "AncestryDNA has the largest consumer DNA database, making it the strongest option for finding living relatives and connecting to family trees. Autosomal test only (no Y-DNA or mtDNA). Ethnicity estimates are broad — strongest value is relative matching and tree integration.",
    strengths: ["Largest relative-matching database", "Seamless family-tree integration", "Broad ethnicity estimates"],
    icon: TreePine,
    purchaseUrl: "https://www.ancestry.com/dna/",
    downloadSupport: true,
  },
  {
    id: "23andme",
    name: "23andMe",
    tagline: "Best for haplogroups, traits, and ancestry composition",
    description:
      "23andMe offers autosomal ancestry composition, paternal haplogroup (Y-DNA), and maternal haplogroup (mtDNA) in one test — without the extra cost of dedicated Y or mt tests. Optional health and traits reports available separately. Relative matching database is large but smaller than AncestryDNA.",
    strengths: ["Paternal and maternal haplogroups included", "Detailed ancestry composition reports", "Optional health/traits data"],
    icon: Microscope,
    purchaseUrl: "https://www.23andme.com/",
    downloadSupport: true,
  },
  {
    id: "myheritage",
    name: "MyHeritage DNA",
    tagline: "Best for international and European genealogy",
    description:
      "MyHeritage has strong databases for European — especially Ashkenazi Jewish, Scandinavian, and Southern European — genealogy. Useful if your paper trail points outside North America. Also accepts raw DNA uploads from other providers for free ethnicity and matching analysis.",
    strengths: ["Strong international databases", "Free raw-file upload option", "Chromosome browser included"],
    icon: Globe,
    purchaseUrl: "https://www.myheritage.com/dna",
    downloadSupport: true,
    mobileNote: "MyHeritage currently states that raw DNA download cannot be completed on iPhone or iPad. Use a desktop or Android device.",
  },
  {
    id: "familytreedna",
    name: "FamilyTreeDNA",
    tagline: "Best for Y-DNA and mtDNA paternal/maternal line research",
    description:
      "The only major provider offering dedicated Y-DNA (paternal direct line) and mtDNA (maternal direct line) tests alongside autosomal. Essential if you need to trace a single ancestral surname line deep into history or verify a specific lineage. Also accepts raw DNA uploads.",
    strengths: ["Only major provider for dedicated Y-DNA tests", "Dedicated mtDNA deep-clade tests", "Accepts raw uploads from other providers"],
    icon: GitBranch,
    purchaseUrl: "https://www.familytreedna.com/",
    downloadSupport: true,
  },
  {
    id: "livingdna",
    name: "Living DNA",
    tagline: "Best for regional European and British Isles ancestry",
    description:
      "Living DNA provides exceptionally granular regional breakdowns for British Isles and European ancestry — where most other tests return a single 'British & Irish' figure, Living DNA can distinguish regions within England, Scotland, and Ireland. Accepts raw uploads from other providers.",
    strengths: ["Most granular British Isles regional breakdown", "Detailed European sub-regional analysis", "Accepts raw uploads from other providers"],
    icon: MapPin,
    purchaseUrl: "https://livingdna.com/",
    downloadSupport: true,
  },
];

// ─── Historical record services (not DNA testing) ─────────────────────────

const RECORD_SERVICES = [
  {
    id: "familysearch",
    name: "FamilySearch",
    url: "https://www.familysearch.org",
    free: true,
    badge: "Free · No Account Required to Search",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    tagline: "Billions of free historical records worldwide",
    funding: "Funded by The Church of Jesus Christ of Latter-day Saints. Open to everyone regardless of religious affiliation or background.",
    description:
      "FamilySearch is the largest free genealogical record collection in the world, containing billions of digitised historical documents — birth registrations, baptism records, marriage registers, census pages, death certificates, military records, immigration lists, and more — spanning centuries and dozens of countries. It also maintains a shared, collaborative family tree contributed by millions of users.",
    warning:
      "The FamilySearch collaborative tree is user-editable and frequently contains errors, unsourced connections, and duplicate entries. Before accepting any relationship as fact, check the sources attached to each record and review the change history on any tree entry. Always prefer an original document over a tree entry.",
    strengths: [
      "Completely free to search and access",
      "Billions of historical records worldwide",
      "Especially strong for US, UK, Scandinavia, Latin America",
      "Collaborative family tree (verify all sources before trusting)",
    ],
    icon: ScrollText,
  },
  {
    id: "ancestry",
    name: "Ancestry",
    url: "https://www.ancestry.com",
    free: false,
    badge: "Subscription Required",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
    tagline: "Largest subscription historical-record collection",
    funding: null,
    description:
      "Ancestry holds the largest subscription-based collection of digitised historical records, including US census records, UK civil registration, immigration manifests, military service records, newspapers, and city directories. Its record collection and FamilySearch's overlap significantly but are not identical — each holds records the other does not.",
    warning: null,
    strengths: [
      "Extensive record collection beyond FamilySearch's holdings",
      "Strong DNA relative-matching (separate from records subscription)",
      "Digitised newspapers, city directories, and unique regional collections",
      "Primary cross-check source against FamilySearch",
    ],
    icon: BookOpen,
  },
  {
    id: "myheritage",
    name: "MyHeritage",
    url: "https://www.myheritage.com",
    free: false,
    badge: "Free tier + Subscription",
    badgeColor: "bg-violet-100 text-violet-800 border-violet-200",
    tagline: "Best for international records and alternate collections",
    funding: null,
    description:
      "MyHeritage has particular strength in European records — especially for families with roots in Eastern Europe, Scandinavia, Ashkenazi Jewish communities, and Southern Europe. Its record sets often differ from both FamilySearch and Ancestry, making it a useful third source when the first two searches are inconclusive or contradictory.",
    warning: null,
    strengths: [
      "Strong international and European record collections",
      "Alternate digitisation projects not on other platforms",
      "Useful when FamilySearch and Ancestry disagree or have gaps",
    ],
    icon: Globe,
  },
];

const CROSSCHECK_STEPS = [
  {
    n: 1,
    title: "Start with FamilySearch (free)",
    body: "Search for the person by name, approximate birth year, and birthplace. Note every source document attached to the result — a census page, a baptism register, or a civil registration is evidence. A tree entry without a source attached is a hypothesis, not evidence. Check the change history on any shared-tree entry to see who added the relationship and when.",
    tip: "FamilySearch → open any person → click 'Sources' tab to see attached records, and 'History' to see edits.",
  },
  {
    n: 2,
    title: "Cross-check on Ancestry",
    body: "Search the same person on Ancestry, focusing on historical records (census, vital, military, immigration) rather than hints from other user trees. Note any differences in name spelling, birth date, birthplace, parents, or spouse. Ancestry and FamilySearch each hold records the other does not — a record that appears on one platform but not the other is not automatically wrong.",
    tip: "On Ancestry, use 'Search Records' and filter by record category to avoid tree-only hints.",
  },
  {
    n: 3,
    title: "Add MyHeritage if results conflict or the family is international",
    body: "If FamilySearch and Ancestry give different dates, different parents, or different birthplaces — or if the family has roots outside North America and the British Isles — search MyHeritage for a third data point. Consistent agreement across three independent record sets substantially increases confidence.",
    tip: "Disagreement between services is normal and useful — it tells you where to look for the original document that resolves the conflict.",
  },
  {
    n: 4,
    title: "Record what each service says",
    body: "For any name, date, or relationship you want to establish as fact, note the claim from each service and whether it is backed by an original document or only by another user's tree. Use the Archive's Research Projects to create a Claim Card for the relationship and attach sources as supporting or contesting evidence — exactly the same epistemic standard applied to historical and theological claims in the rest of the archive.",
    tip: "Claim Cards accept a status: Supported, Contested, Uncertain, or Refuted. Start at Uncertain until you have at least one original record.",
  },
  {
    n: 5,
    title: "Flag conflicts for follow-up",
    body: "When two sources disagree, do not pick the more convenient one. Create a note or Claim Card flagging the conflict and identifying what original document would resolve it — a specific county death register, a ship manifest, a military draft card. The conflict itself is a research lead.",
    tip: "A conflict between two user trees is not meaningful. A conflict between an original death certificate and a census record is — and warrants finding the underlying primary source.",
  },
];

const RECORD_PRIORITY = [
  { level: "1 — Strongest", label: "Original records", examples: "Census page, baptism register, ship manifest, civil death certificate, military service record, land deed", color: "text-emerald-800 bg-emerald-50 border-emerald-200" },
  { level: "2 — Good", label: "Derivative records", examples: "Transcribed indexes, published vital records compilations, official abstracts of originals", color: "text-sky-800 bg-sky-50 border-sky-200" },
  { level: "3 — Lead only", label: "User-submitted trees", examples: "FamilySearch collaborative tree entries, Ancestry member trees, MyHeritage family trees — without sources attached", color: "text-amber-800 bg-amber-50 border-amber-200" },
  { level: "4 — Weakest", label: "Unsourced hints", examples: "Automated hints based solely on other users' unsourced trees", color: "text-red-800 bg-red-50 border-red-200" },
];

// ─── Export instructions ───────────────────────────────────────────────────

const EXPORT_GUIDES: Record<string, {
  provider: string;
  steps: { text: string; warning?: string }[];
  mobileNote?: string;
  fileNote?: string;
}> = {
  ancestrydna: {
    provider: "AncestryDNA",
    steps: [
      { text: "Sign in at ancestry.com." },
      { text: "Click DNA in the top navigation bar." },
      { text: "Click your test name to open your DNA results." },
      { text: "Click Settings in the upper right of the DNA page." },
      { text: "Scroll down to the section labelled Download or delete your DNA data." },
      { text: "Click Download DNA Data." },
      { text: "Read the information screen, then click Download to confirm." },
      { text: "Ancestry will email you a confirmation link. Click the link in that email to download a ZIP file containing your raw data." },
    ],
    fileNote: "Your download is a ZIP file. Extract it to find a TXT file — that is your raw data file to upload to analysis tools.",
  },
  "23andme": {
    provider: "23andMe",
    steps: [
      { text: "Sign in at 23andme.com." },
      { text: "Click your profile icon in the upper right corner." },
      { text: "Select Resources from the dropdown menu." },
      { text: "Click Browse Raw Genotyping Data." },
      { text: "Scroll to the bottom of the page and click Download." },
      { text: "23andMe will not download immediately — it sends a confirmation email first. Check your inbox." },
      { text: "Click the link in the email to authorise the download. The file will then be available to download from the same page." },
      { text: "Download the ZIP file. Inside you will find a TXT file containing your raw genotype data." },
    ],
    fileNote: "The download is a ZIP file containing a .txt raw data file. Some analysis tools accept the ZIP directly; others require you to extract the TXT first.",
  },
  myheritage: {
    provider: "MyHeritage DNA",
    steps: [
      { text: "Sign in at myheritage.com." },
      { text: "Click DNA in the top navigation." },
      { text: "Select Manage DNA kits." },
      { text: "Find your kit in the list. Click the three-dot menu (⋮) to the right of your kit name." },
      { text: "Select Download from the menu that appears." },
      { text: "MyHeritage will send a confirmation email to your registered address. Click the authorisation link in that email." },
      { text: "Return to the Manage DNA kits page. The download link will now be active — click it to save the file to your device." },
    ],
    mobileNote: "MyHeritage currently states that raw DNA download cannot be completed on iPhone or iPad. If you are on an iPhone or iPad, use a desktop computer or Android device to complete this step.",
    fileNote: "The downloaded file is a ZIP containing a CSV raw data file.",
  },
  familytreedna: {
    provider: "FamilyTreeDNA",
    steps: [
      { text: "Sign in at familytreedna.com." },
      { text: "In the top navigation, go to Results & Tools." },
      { text: "Select Autosomal DNA from the submenu. This takes you to your Family Finder results." },
      { text: "Look for Download Raw Data in the tools area on that page and click it." },
      { text: "Alternatively: from your main Dashboard, find the Autosomal DNA Results & Tools widget and click Data Download." },
      { text: "Select the file format (choose the full raw data file if given a choice) and click Download. No email confirmation is required — the file downloads directly to your device." },
    ],
    fileNote: "FamilyTreeDNA raw data files are typically CSV or ZIP format depending on the test type. Autosomal raw data is widely compatible with analysis tools.",
  },
  livingdna: {
    provider: "Living DNA",
    steps: [
      { text: "Sign in at livingdna.com." },
      { text: "Click your account or profile menu in the upper right corner." },
      { text: "Select Profiles." },
      { text: "Select the profile you want to download data for (if you manage multiple profiles)." },
      { text: "Click Download." },
      { text: "You will be offered file options. Choose the Autosomal file — this is the file compatible with other genealogy sites and analysis tools." },
      { text: "The file downloads to your device directly — no email confirmation step." },
    ],
    fileNote: "Choose the autosomal file type specifically. Living DNA may also offer other file types; the autosomal file is the one compatible with DNAGenics, GEDmatch, and other analysis platforms.",
  },
};

// ─── Where to take your raw file ──────────────────────────────────────────

const ANALYSIS_SERVICES = [
  {
    name: "DNAGenics",
    url: "https://dnagenics.com",
    badge: "Free · 100+ Calculators",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Upload your raw file to run 100+ free admixture calculators — broad ancestry, ancient DNA models, regional breakdowns, migration corridor analysis, and kit comparison. No purchase required.",
    accepts: ["AncestryDNA", "23andMe", "MyHeritage", "FamilyTreeDNA", "Living DNA"],
  },
  {
    name: "GEDmatch",
    url: "https://www.gedmatch.com",
    badge: "Free & Paid Tiers",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Cross-provider relative matching — compare your DNA against users who tested with any company. Also includes admixture tools and a chromosome browser. Essential if your relatives tested with different providers.",
    accepts: ["AncestryDNA", "23andMe", "MyHeritage", "FamilyTreeDNA", "Living DNA"],
  },
  {
    name: "Living DNA (upload)",
    url: "https://livingdna.com",
    badge: "Free Upload",
    badgeColor: "bg-violet-100 text-violet-800 border-violet-200",
    description: "If you tested elsewhere, Living DNA accepts raw file uploads and provides its detailed regional European and British Isles breakdown at no cost — useful if that is your focus and you do not want to re-test.",
    accepts: ["AncestryDNA", "23andMe", "FamilyTreeDNA"],
  },
];

// ─── DNAGenics tool categories ─────────────────────────────────────────────

const DNA_TOOLS = [
  { icon: Globe, label: "Broad Admixture Calculators", description: "100+ free calculators modelling your genome against continental and sub-continental reference populations. Upload once, run any calculator.", url: "https://dnagenics.com" },
  { icon: Mountain, label: "Ancient DNA Models", description: "Calculators built on ancient DNA (aDNA) reference panels — Neolithic farmers, Steppe pastoralists, Bronze Age populations, and more.", url: "https://dnagenics.com" },
  { icon: MapPin, label: "Regional & Fine-Scale Analysis", description: "Fine-grained regional breakdowns within Europe, the Near East, South Asia, and other zones.", url: "https://dnagenics.com" },
  { icon: GitBranch, label: "Migration & Population Corridor Tools", description: "Analysis tools designed to surface genetic signals associated with documented historical migration corridors.", url: "https://dnagenics.com" },
  { icon: ArrowRightLeft, label: "Kit Comparison", description: "Compare multiple kits side by side — useful for identifying which components are shared across family members.", url: "https://dnagenics.com" },
  { icon: FileCode, label: "File Conversion & Imputation", description: "Convert raw DNA files between formats or run imputation to expand the number of analysable SNPs.", url: "https://dnagenics.com" },
];

// ─── Archive methodology steps ─────────────────────────────────────────────

const ARCHIVE_STEPS = [
  { n: 1, title: "Establish the Historical Corridor", body: "Run an admixture calculator on DNAGenics. Note the reference populations with strong signals, then search the archive for scholarship on those populations and their documented migration routes." },
  { n: 2, title: "Research Parish & Denominational Records", body: "Ancestors are tracked through church and denominational records. The archive contains scholarship on religious population shifts that affect where records are held." },
  { n: 3, title: "Build a Research Project", body: "Open a Research Project. Save archive sources that speak to your migration corridor, and create Claim Cards for specific ancestry hypotheses with attached evidence." },
  { n: 4, title: "Treat DNA Signals as Starting Points", body: "Admixture percentages are model-based statistical estimates. A strong signal tells you which populations to research — the archive supplies the documentary evidence to evaluate the hypothesis." },
];

// ─── Component ────────────────────────────────────────────────────────────

type ExportSection = "privacy" | "ancestrydna" | "23andme" | "myheritage" | "familytreedna" | "livingdna" | "where";

export function GenealogyPage() {
  const [exportOpen, setExportOpen] = useState<ExportSection[]>([]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="space-y-4 border-b border-border pb-10">
        <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-500">
          <GitBranch className="h-6 w-6" />
          <span className="text-sm font-bold uppercase tracking-wider">Historical Demographics</span>
        </div>
        <h1 className="text-4xl font-serif text-foreground">Genealogy & DNA Resource Center</h1>
        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
          A practical guide to DNA testing, raw-data export, analysis tools, and archive research —
          for researchers at every stage, from first test to building documented evidence trails.
        </p>
        {/* Quick jump links */}
        <div className="flex flex-wrap gap-2 pt-2 text-sm">
          {[
            { label: "Historical Records", href: "#records" },
            { label: "Cross-check an Ancestor", href: "#crosscheck" },
            { label: "DNA Testing Providers", href: "#providers" },
            { label: "Export Your Raw DNA", href: "#export" },
            { label: "Analysis Tools", href: "#analysis" },
            { label: "DNAGenics", href: "#dnagenics" },
            { label: "Archive Research", href: "#archive" },
          ].map(l => (
            <a key={l.href} href={l.href} className="px-3 py-1 rounded-full border border-border bg-secondary/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          ))}
        </div>
      </header>

      {/* ── Historical Records & Family Trees ─────────────────────────── */}
      <section id="records" className="space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif">Historical Records & Family Trees</h2>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Three complementary services for finding original historical documents and cross-checking
            family relationships. None are affiliated with or endorsed by the Archive & Research Center.
          </p>
        </div>

        {/* FamilySearch — featured */}
        <div className="rounded-xl border-2 border-emerald-700/30 bg-emerald-950/5 overflow-hidden">
          <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-emerald-100 text-emerald-800 border-emerald-200">
                  Free · No Account Required to Search
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-secondary border-border text-muted-foreground">
                  <ExternalLink className="h-3 w-3" /> External Resource · Independent Third Party
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-emerald-700" />
                <h3 className="text-xl font-serif">FamilySearch</h3>
              </div>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                Funded by The Church of Jesus Christ of Latter-day Saints. Open to everyone regardless of religious affiliation or background.
              </p>
            </div>
            <a href="https://www.familysearch.org" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
              <Button className="gap-2 bg-emerald-800 hover:bg-emerald-700 text-white w-full sm:w-auto">
                Search FamilySearch <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>

          <div className="px-6 pb-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              FamilySearch is the largest free genealogical record collection in the world, containing billions of
              digitised historical documents — birth registrations, baptism records, marriage registers, census pages,
              death certificates, military records, immigration lists, and more — spanning centuries and dozens of
              countries. It also maintains a shared, collaborative family tree contributed by millions of users.
            </p>

            <div className="flex flex-wrap gap-2">
              {["Completely free to search and access", "Billions of historical records worldwide", "Strong for US, UK, Scandinavia, Latin America", "Collaborative family tree (verify sources before trusting)"].map(s => (
                <span key={s} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
                  <ChevronRight className="h-3 w-3 text-emerald-700" /> {s}
                </span>
              ))}
            </div>

            {/* Shared-tree warning */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold">About the FamilySearch collaborative tree</div>
                <p className="text-xs leading-relaxed">
                  The FamilySearch family tree is user-editable and frequently contains errors, unsourced
                  connections, and duplicate entries introduced by well-meaning but mistaken contributors.
                  Before accepting any relationship as fact, click the <strong>Sources</strong> tab on any person
                  to see attached original documents, and check the <strong>History/Changes</strong> tab to see
                  who added each relationship and when. A tree entry without an attached original source is a
                  hypothesis — not evidence.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ancestry + MyHeritage — cross-check pair */}
        <div className="grid sm:grid-cols-2 gap-4">
          {RECORD_SERVICES.filter(s => s.id !== "familysearch").map(svc => (
            <div key={svc.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${svc.badgeColor}`}>
                    {svc.badge}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <svc.icon className="h-4 w-4 text-primary" />
                    <span className="font-serif text-base font-medium">{svc.name}</span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">{svc.tagline}</p>
                </div>
                <a href={svc.url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1 flex-shrink-0">
                    Open <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{svc.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {svc.strengths.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                    <ChevronRight className="h-3 w-3 text-primary" /> {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cross-check this ancestor ───────────────────────────────────── */}
      <section id="crosscheck" className="space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <GitMerge className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Verification Workflow</span>
          </div>
          <h2 className="text-2xl font-serif">Cross-check this ancestor</h2>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            No single service is complete or error-free. The standard practice in genealogy is to verify
            every name, date, place, and relationship against at least two independent sources — and to
            prefer original documents over user-submitted trees whenever possible.
          </p>
        </div>

        {/* Source quality hierarchy */}
        <div className="space-y-3">
          <h3 className="text-base font-serif font-medium flex items-center gap-2">
            <Scale className="h-4 w-4 text-muted-foreground" /> Source quality — strongest to weakest
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {RECORD_PRIORITY.map(r => (
              <div key={r.level} className={`rounded-lg border p-3 text-xs ${r.color}`}>
                <div className="font-bold uppercase tracking-wider text-[10px] mb-1">{r.level}</div>
                <div className="font-semibold text-sm mb-0.5">{r.label}</div>
                <div className="opacity-80 leading-relaxed">{r.examples}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step-by-step workflow */}
        <div className="space-y-0 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-border">
          {CROSSCHECK_STEPS.map(step => (
            <div key={step.n} className="relative pl-10 pb-8 last:pb-0">
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center -ml-[3px]">
                {step.n}
              </div>
              <h3 className="text-base font-semibold mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">{step.body}</p>
              <div className="inline-flex items-start gap-2 bg-secondary/50 border border-border rounded-md px-3 py-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary" />
                <span>{step.tip}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick-access service buttons */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="font-serif font-medium flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" /> Look up the same person on all three
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <a href="https://www.familysearch.org" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-emerald-700/30 bg-emerald-950/5 hover:bg-emerald-900/10 transition-colors group">
              <div>
                <div className="font-medium text-sm group-hover:text-emerald-800 transition-colors">FamilySearch</div>
                <div className="text-xs text-muted-foreground">Free · check Sources tab</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
            <a href="https://www.ancestry.com/search/" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors group">
              <div>
                <div className="font-medium text-sm group-hover:text-primary transition-colors">Ancestry</div>
                <div className="text-xs text-muted-foreground">Historical records · subscription</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
            <a href="https://www.myheritage.com/research" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors group">
              <div>
                <div className="font-medium text-sm group-hover:text-primary transition-colors">MyHeritage</div>
                <div className="text-xs text-muted-foreground">International records · free + paid</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </div>
          <div className="flex flex-wrap gap-3 pt-1 border-t border-border">
            <Button asChild size="sm">
              <Link href="/projects">
                <Flag className="h-3.5 w-3.5 mr-2" /> Record findings in a Research Project
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/claim-cards">Create a Claim Card for a relationship</Link>
            </Button>
          </div>
        </div>

        {/* Note about Research Projects integration */}
        <div className="rounded-lg bg-secondary/30 border border-border p-4 text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Tip: use the archive's Research Projects for genealogy too.</span>{" "}
          Open a project for a family line. Save source links as notes. Create a Claim Card for each
          relationship you are trying to establish (e.g. "John Smith b. 1832 is the father of Mary Smith b. 1855"),
          then attach evidence from original documents as supporting sources — and conflicting tree entries as
          contested evidence. This brings genealogical research under the same epistemic standards as the archive's
          historical and theological materials.
        </div>
      </section>

      {/* ── Provider Directory ─────────────────────────────────────────── */}
      <section id="providers" className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif">DNA Testing Providers</h2>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Five established providers — each optimised for different research goals. Prices change
            frequently; click the link for each provider's current pricing. No provider is affiliated
            with or endorsed by the Archive & Research Center.
          </p>
        </div>

        <div className="space-y-4">
          {PROVIDERS.map(p => (
            <Card key={p.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                      <p.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-serif">{p.name}</CardTitle>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mt-0.5">{p.tagline}</p>
                    </div>
                  </div>
                  <a href={p.purchaseUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    <Button size="sm" variant="outline" className="gap-1.5 w-full sm:w-auto">
                      View current pricing <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                <div className="flex flex-wrap gap-2">
                  {p.strengths.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-primary" /> {s}
                    </span>
                  ))}
                </div>
                {p.mobileNote && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>{p.mobileNote}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Genochip waitlist callout */}
        <Card className="border-amber-200/60 bg-amber-50/40">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="flex-1 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
                Waitlist Only — Not Yet Available
              </div>
              <p className="text-sm font-medium mt-1">Genochip DNA Test (DNAGenics)</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                DNAGenics is developing its own DNA test — the Genochip. It is currently on a waitlist
                and <strong>not available for purchase</strong>. No release date has been announced.
                The Archive & Research Center cannot represent its specifications or timeline.
              </p>
            </div>
            <a href="https://dnagenics.com" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-800 hover:bg-amber-100 gap-2 w-full sm:w-auto">
                <ClipboardList className="h-3.5 w-3.5" /> Join the Genochip Waitlist <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </CardContent>
        </Card>
      </section>

      {/* ── Raw DNA Export ─────────────────────────────────────────────── */}
      <section id="export" className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif">Already Tested Somewhere Else?</h2>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Every major testing provider lets you download your own raw DNA data — the same underlying
            data your provider uses, in a file you own. You can upload that file to additional analysis
            tools without re-testing.
          </p>
        </div>

        {/* Privacy notice — shown before steps */}
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-red-800">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            Read before transferring your raw DNA file
          </div>
          <ul className="space-y-2 text-sm text-red-900/80">
            <li className="flex gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
              <span><strong>Genetic data is uniquely identifying.</strong> Unlike a password, it cannot be changed or anonymised after disclosure. Treat your raw file at least as carefully as your passport.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
              <span><strong>Review the destination site's privacy policy and data retention terms</strong> before uploading. Look specifically for whether they share data with third parties and whether you can permanently delete your data later.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
              <span><strong>Enable two-factor authentication (2FA)</strong> on your testing provider account and on any analysis service you upload to.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
              <span><strong>The Archive & Research Center does not ingest, copy, store, or process your raw DNA.</strong> You download to your own device; you upload directly to the outside service you choose. We are only providing instructions.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
              <span>Keep your downloaded raw-data file in a <strong>password-protected folder</strong> on your device. Do not leave it in your Downloads folder or share it by email.</span>
            </li>
          </ul>
        </div>

        {/* Per-provider accordion */}
        <Accordion type="multiple" className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {Object.entries(EXPORT_GUIDES).map(([id, guide]) => (
            <AccordionItem key={id} value={id} className="border-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/30 font-medium text-base">
                <div className="flex items-center gap-3 text-left">
                  <Download className="h-4 w-4 text-primary flex-shrink-0" />
                  Download from {guide.provider}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-0">
                <div className="space-y-4">
                  {/* Danger warning */}
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Download ≠ Delete.</strong> These steps only download a copy of your data.
                      Do not click any "Delete DNA", "Remove kit", or similar option on the same page —
                      that permanently removes your test results.
                    </span>
                  </div>

                  {/* Mobile note for MyHeritage */}
                  {guide.mobileNote && (
                    <div className="flex items-start gap-2 bg-sky-50 border border-sky-200 rounded-md p-3 text-xs text-sky-800">
                      <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <span>{guide.mobileNote}</span>
                    </div>
                  )}

                  {/* Steps */}
                  <ol className="space-y-3">
                    {guide.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-relaxed text-foreground/90">{step.text}</span>
                      </li>
                    ))}
                  </ol>

                  {/* File note */}
                  {guide.fileNote && (
                    <div className="flex items-start gap-2 bg-secondary/40 border border-border rounded-md p-3 text-xs text-muted-foreground">
                      <FileCode className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary" />
                      <span>{guide.fileNote}</span>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── Where to use the file ──────────────────────────────────────── */}
      <section id="analysis" className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif">Where to Use Your Raw DNA File</h2>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Once you have downloaded your raw DNA file, you can upload it to any of these independent
            third-party platforms. None are affiliated with the Archive & Research Center.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {ANALYSIS_SERVICES.map(svc => (
            <Card key={svc.name} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border w-fit mb-2 ${svc.badgeColor}`}>
                  {svc.badge}
                </div>
                <CardTitle className="text-base font-serif">{svc.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{svc.description}</p>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Accepts files from: </span>
                  {svc.accepts.join(", ")}
                </div>
                <a href={svc.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full gap-2 mt-2">
                    Open {svc.name} <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── DNAGenics featured ─────────────────────────────────────────── */}
      <section id="dnagenics" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <ExternalLink className="h-3 w-3" /> External Resource · Independent Third Party
            </div>
            <h2 className="text-2xl font-serif flex items-center gap-2 mt-2">
              <Dna className="h-5 w-5 text-emerald-700" /> DNAGenics
            </h2>
          </div>
          <div className="flex gap-3 flex-wrap">
            <a href="https://dnagenics.com" target="_blank" rel="noopener noreferrer">
              <Button className="gap-2 bg-emerald-800 hover:bg-emerald-700 text-white">
                <FlaskConical className="h-4 w-4" /> Start Free Analysis <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
            <a href="https://dnagenics.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2 border-emerald-700/40 text-emerald-800 hover:bg-emerald-900/10">
                Browse Calculators <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-700/20 bg-emerald-950/5 p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            DNAGenics is an independent platform offering <strong className="text-foreground">100+ free admixture calculators</strong>,
            raw DNA file analysis, ancient population modelling, migration corridor tools, kit comparison,
            and file conversion. It is not affiliated with this archive. Upload your raw DNA file from
            any major provider to access all calculators at no cost.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {DNA_TOOLS.map(tool => (
              <a key={tool.label} href={tool.url} target="_blank" rel="noopener noreferrer"
                className="group flex flex-col gap-2 p-4 rounded-lg border border-border bg-card hover:border-emerald-700/40 hover:bg-emerald-900/5 transition-colors">
                <div className="flex items-center justify-between">
                  <tool.icon className="h-4 w-4 text-emerald-700" />
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-medium text-sm group-hover:text-emerald-800 transition-colors">{tool.label}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Archive methodology ─────────────────────────────────────────── */}
      <section id="archive" className="space-y-6">
        <h2 className="text-2xl font-serif border-b border-border pb-3">Using the Archive Alongside DNA Analysis</h2>
        <div className="space-y-0 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-border">
          {ARCHIVE_STEPS.map(step => (
            <div key={step.n} className="relative pl-10 pb-8 last:pb-0">
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center -ml-[3px]">
                {step.n}
              </div>
              <h3 className="text-base font-semibold mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2 flex-wrap">
          <Button asChild>
            <Link href="/archive"><Search className="h-4 w-4 mr-2" /> Search the Archive</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/projects"><BookOpen className="h-4 w-4 mr-2" /> Open a Research Project</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/concierge">Research Concierge</Link>
          </Button>
        </div>
      </section>

      {/* ── Epistemic disclaimer ─────────────────────────────────────────── */}
      <section className="rounded-xl bg-secondary/30 border border-border p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="h-4 w-4 text-muted-foreground" /> How to interpret admixture results
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            ["Results are model-based.", "Admixture calculators use statistical algorithms and reference panels. Different models produce different results from the same DNA file. Neither result is 'wrong' — they reflect different analytical choices."],
            ["Results are ancestry signals, not identity certificates.", "A genetic result indicating affinity with a particular population is a starting point for historical research — not a statement of cultural, ethnic, or national identity."],
            ["Results are not medical information.", "Admixture analysis does not predict health outcomes or disease risk. Do not substitute admixture results for clinical genetic counselling."],
            ["Corroborate with documentary evidence.", "The most reliable conclusions combine consistent genetic signals across multiple independent models with documentary evidence. The archive is the documentary side of that equation."],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-2 items-start">
              <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
              <span><strong className="text-foreground">{title}</strong> {body}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-start gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>
            All external providers and analysis platforms listed here are independent third-party services.
            The Archive & Research Center has no affiliation with, endorsement arrangement with, or financial
            relationship with any of them. Use results as research inputs, not conclusions.
          </span>
        </div>
      </section>
    </div>
  );
}
