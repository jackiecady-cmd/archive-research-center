import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { hasBracketedPlaceholder, legalPageIsPublic } from "@workspace/config/legal";

function contentDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, "../../../../legal"),
    path.resolve(here, "../../../legal"),
    path.resolve(process.cwd(), "legal"),
    path.resolve(process.cwd(), "../../legal"),
  ];
  const found = candidates.find((dir) => existsSync(path.join(dir, "terms-of-use.md")));
  if (!found) throw new Error("Legal drafts were not found");
  return found;
}

const PAGES = [
  { slug: "terms", file: "terms-of-use.md", title: "Terms of Use" },
  { slug: "copyright", file: "copyright-dmca-policy.md", title: "Copyright and DMCA Policy" },
  { slug: "privacy", file: "privacy-policy.md", title: "Privacy Policy" },
  { slug: "translation-disclosure", file: "ai-translation-disclosure.md", title: "AI translation disclosure" },
  { slug: "cookies", file: "cookie-notice.md", title: "Cookie and tracking notice" },
  { slug: "open-source", file: "open-source-notices.md", title: "Open source notices" },
] as const;

type PageSlug = (typeof PAGES)[number]["slug"];

function pageBody(file: string): string {
  return readFileSync(path.join(contentDir(), file), "utf8");
}

function pageRecord(slug: string) {
  return PAGES.find((page) => page.slug === slug);
}

const router = Router();

router.get("/legal/pages", async (req, res): Promise<void> => {
  const admin = req.user?.role === "admin";
  const pages = PAGES.flatMap((page) => {
    const body = pageBody(page.file);
    const isPublic = legalPageIsPublic(body);
    if (!isPublic && !admin) return [];
    return [{
      slug: page.slug,
      title: page.title,
      public: isPublic,
      preview: !isPublic,
      hasPlaceholder: hasBracketedPlaceholder(body),
    }];
  });
  res.json({ pages });
});

router.get("/legal/pages/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const page = pageRecord(slug ?? "");
  if (!page) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const body = pageBody(page.file);
  const isPublic = legalPageIsPublic(body);
  if (!isPublic && req.user?.role !== "admin") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    slug: page.slug as PageSlug,
    title: page.title,
    body,
    public: isPublic,
    preview: !isPublic,
    hasPlaceholder: hasBracketedPlaceholder(body),
  });
});

export default router;
