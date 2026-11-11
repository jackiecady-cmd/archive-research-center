import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiSend } from "@/lib/api";

type LegalPageBody = {
  title: string;
  body: string;
  preview: boolean;
};

export function LegalPage() {
  const params = useParams();
  const slug = params.slug ?? "";
  const page = useQuery({
    queryKey: ["legal-page", slug],
    enabled: slug.length > 0,
    queryFn: async () => {
      const result = await apiSend(`/api/legal/pages/${slug}`);
      if (result.status === 404) return null;
      if (!result.ok) throw new Error("Could not load this page");
      return result.json as LegalPageBody;
    },
  });

  if (page.isLoading) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!page.data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-serif text-3xl">Page not found</h1>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      {page.data.preview ? (
        <p className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
          Administrator preview. This page is not public.
        </p>
      ) : null}
      <h1 className="font-serif text-3xl">{page.data.title}</h1>
      <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">{page.data.body}</pre>
    </article>
  );
}
