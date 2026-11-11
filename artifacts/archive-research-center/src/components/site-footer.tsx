import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TRANSLATION_DISCLOSURE } from "@workspace/config";
import { apiSend } from "@/lib/api";

type LegalLink = { slug: string; title: string; public: boolean };

export function SiteFooter() {
  const pages = useQuery({
    queryKey: ["legal-pages"],
    queryFn: async () => {
      const result = await apiSend("/api/legal/pages");
      if (!result.ok) return [];
      const body = result.json as { pages: LegalLink[] };
      return body.pages.filter((page) => page.public);
    },
  });

  return (
    <footer className="border-t border-border px-4 sm:px-6 py-8 text-sm text-muted-foreground space-y-4">
      <p data-testid="translation-disclosure">{TRANSLATION_DISCLOSURE}</p>
      {pages.data && pages.data.length > 0 ? (
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {pages.data.map((page) => (
            <Link key={page.slug} href={`/legal/${page.slug}`} className="underline underline-offset-4 hover:text-foreground">
              {page.title}
            </Link>
          ))}
        </nav>
      ) : null}
    </footer>
  );
}
