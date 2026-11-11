export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function markdownToPrintBody(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.startsWith("> ")) return `<blockquote>${escapeHtml(line.slice(2))}</blockquote>`;
      if (line.startsWith("---")) return "<hr/>";
      if (line.trim() === "") return "<br/>";
      const safe = escapeHtml(line)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");
      return `<p>${safe}</p>`;
    })
    .join("");
}

export function buildPrintDocument(title: string, markdown: string): string {
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 740px; margin: 40px auto; color: #111; line-height: 1.7; }
        h1 { font-size: 1.8rem; border-bottom: 2px solid #ccc; padding-bottom: .4rem; }
        h2 { font-size: 1.1rem; color: #444; margin-top: 1.6rem; }
        blockquote { border-left: 4px solid #e05; padding: .3rem .8rem; background: #fff5f5; color: #700; margin: .5rem 0; }
        hr { border: none; border-top: 1px solid #ddd; margin: 1.5rem 0; }
        p { margin: .25rem 0; } br { display: none; }
        @media print { body { margin: 1cm; } }
      </style></head><body>${markdownToPrintBody(markdown)}</body></html>`;
}
