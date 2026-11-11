import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useGetSourceStats, useListCollections, useListSources } from "@workspace/api-client-react";
import { ArrowRight, FlaskConical, Languages, Search, Users, Lock, Compass, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type React from "react";

export function HomePage() {
  const { data: stats, isLoading: statsLoading } = useGetSourceStats();
  const { data: collections, isLoading: collectionsLoading } = useListCollections();
  useListSources({ limit: 3 }); // prefetch

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-14 sm:space-y-16">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="text-center space-y-5 sm:space-y-6">
        <h1 className="text-3xl sm:text-5xl font-serif tracking-tight text-primary">
          The Archive & Research Center
        </h1>
        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          A reference-grade digital research library for historians, theologians, and independent scholars.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          <Link href="/archive" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            <Search className="mr-2 h-4 w-4" />
            Search the Archive
          </Link>
          <Link href="/concierge" className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
            Research Concierge
          </Link>
        </div>
      </section>

      {/* ── Research Concierge — Start Here ──────────────────────────────── */}
      <section className="rounded-2xl border-2 border-primary/20 bg-primary/5 overflow-hidden">
        <div className="p-6 sm:p-10 space-y-8 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-12 sm:items-center">
          {/* Left: copy + CTA */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-primary">
              <Compass className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Start here</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif leading-snug">
              Not sure where to begin?
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              The Research Concierge builds a pathway from the kind of historical work you do.
              Sign in, pick a starting point, and open a collection or a first research project.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/concierge"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 gap-2">
                Get my research pathway <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Takes about 1 minute
              </span>
            </div>
          </div>

          {/* Right: researcher-type quick-pick tiles */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "New to Historical Research",
                sub: "Learn how sources are graded, what provenance means, and why evidence trails matter.",
              },
              {
                label: "Historian / Academic",
                sub: "Provenance, confidence grades, and evidence trails across the archive.",
              },
              {
                label: "Pastor / Ministry Leader",
                sub: "Primary sources on Jesus of Nazareth, separated from secondary scholarship.",
              },
              {
                label: "Feeling overwhelmed?",
                sub: "Ask for one 15-minute next step — nothing more.",
                highlight: true,
              },
            ].map(item => (
              <Link key={item.label} href="/concierge"
                className={`block rounded-xl border p-3 sm:p-4 text-left hover:border-primary/50 transition-colors ${
                  item.highlight
                    ? "border-primary/30 bg-primary/10 hover:bg-primary/15"
                    : "border-border bg-background hover:bg-primary/5"
                }`}>
                <div className="font-serif text-xs sm:text-sm font-medium leading-snug mb-1">{item.label}</div>
                <div className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-border/50">
        <StatCard label="Total Sources"     value={stats?.totalSources}                                         loading={statsLoading} />
        <StatCard label="Collections"       value={collections?.length}                                          loading={collectionsLoading} />
        <StatCard label="Primary Sources"   value={stats?.byType.find(t => t.type === "primary")?.count ?? 0}  loading={statsLoading} />
        <StatCard label="Translations"      value={stats?.byType.find(t => t.type === "translation")?.count ?? 0} loading={statsLoading} />
      </section>

      {/* ── Flagship Collections ─────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-serif text-foreground">Flagship Collections</h2>
          <Link href="/collections" className="text-sm font-medium text-primary flex items-center hover:underline">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {collectionsLoading ? (
            <>
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </>
          ) : (
            collections?.filter(c => c.featured).slice(0, 2).map(collection => (
              <Link key={collection.id} href={`/collections/${collection.slug}`}>
                <Card className="group cursor-pointer hover:border-primary/50 transition-colors h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl group-hover:text-primary transition-colors">{collection.name}</CardTitle>
                    <CardDescription>{collection.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{collection.description}</p>
                    <span className="font-medium text-sm text-foreground bg-secondary px-3 py-1 rounded-full self-start">
                      {collection.sourceCount} sources
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* ── Research Pathways ────────────────────────────────────────────── */}
      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-serif text-foreground">Research Pathways</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PathwayTile href="/projects"    title="Projects & Notes"    description="Manage your ongoing research and evaluate claims."            icon={FlaskConical} />
          <PathwayTile href="/commons"     title="Research Commons"    description="Discuss sources and methodologies with peers."               icon={Users} />
          <PathwayTile href="/translation" title="Translation Center"  description="Tools for manuscript comparison and language."               icon={Languages} />
          <PathwayTile href="/rooms"       title="Private Rooms"       description="Invitation-only discussions for a research circle."         icon={Lock} />
        </div>
      </section>

    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value?: number; loading: boolean }) {
  return (
    <div className="text-center space-y-2">
      {loading ? (
        <Skeleton className="h-8 w-16 mx-auto" />
      ) : (
        <div className="text-2xl sm:text-3xl font-serif font-bold text-primary">{value ?? 0}</div>
      )}
      <div className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function PathwayTile({ href, title, description, icon: Icon }: {
  href: string; title: string; description: string; icon: React.ElementType;
}) {
  return (
    <Link href={href}>
      <div className="group p-4 sm:p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all h-full cursor-pointer space-y-3">
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div>
          <h3 className="font-serif font-medium text-sm group-hover:text-primary transition-colors leading-snug">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{description}</p>
        </div>
      </div>
    </Link>
  );
}
