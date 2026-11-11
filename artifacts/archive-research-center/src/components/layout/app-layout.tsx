import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Book, Library, Users, UserCircle, Search, FileText,
  FlaskConical, Languages, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Home",               href: "/",           icon: Library,    section: "main" },
  { label: "Archive Search",     href: "/archive",    icon: Search,     section: "archive" },
  { label: "Collections",        href: "/collections",icon: Book,       section: "archive" },
  { label: "Research Projects",  href: "/projects",   icon: FlaskConical, section: "research" },
  { label: "Claim Cards",        href: "/claim-cards",icon: FileText,   section: "research" },
  { label: "Research Concierge", href: "/concierge",  icon: UserCircle, section: "community" },
  { label: "Research Commons",   href: "/commons",    icon: Users,      section: "community" },
  { label: "Translation Center", href: "/translation",icon: Languages,  section: "community" },
  { label: "Account & Membership", href: "/account",  icon: UserCircle, section: "account" },
];

const SECTIONS = [
  { key: "main",      label: null },
  { key: "archive",   label: "Archive" },
  { key: "research",  label: "Research" },
  { key: "community", label: "Community" },
  { key: "account",   label: "Settings" },
];

function isActive(href: string, location: string) {
  if (href === "/") return location === "/";
  return location.startsWith(href);
}

function NavContents({
  location,
  onNavigate,
}: {
  location: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-8">
      {SECTIONS.map(({ key, label }) => {
        const items = NAV_ITEMS.filter(i => i.section === key);
        if (!items.length) return null;
        return (
          <div key={key} className="space-y-1">
            {label && (
              <h4 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-2 mb-2">
                {label}
              </h4>
            )}
            {items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive(item.href, location)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarHeader() {
  return (
    <div className="p-6 flex-shrink-0">
      <Link href="/">
        <span className="font-serif text-xl font-semibold tracking-tight text-sidebar-foreground leading-snug">
          Archive &amp;<br />Research Center
        </span>
      </Link>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close drawer when user navigates
  const handleNavigate = () => setSheetOpen(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* ── Desktop sidebar (md+) ──────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex-col">
        <SidebarHeader />
        <NavContents location={location} />
      </aside>

      {/* ── Mobile top bar + Sheet drawer (<md) ───────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border">
        <Link href="/" className="font-serif text-base font-semibold text-sidebar-foreground leading-tight">
          Archive &amp; Research Center
        </Link>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Open navigation"
              className="p-2 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-sidebar-border flex-shrink-0">
              <span className="font-serif text-base font-semibold text-sidebar-foreground">
                Archive &amp; Research Center
              </span>
              <SheetClose asChild>
                <button
                  aria-label="Close navigation"
                  className="p-1.5 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </SheetClose>
            </div>
            <div className="flex-1 overflow-y-auto pt-4">
              <NavContents location={location} onNavigate={handleNavigate} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background min-w-0">
        {/* Spacer for mobile top bar */}
        <div className="md:hidden h-[52px] flex-shrink-0" />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
