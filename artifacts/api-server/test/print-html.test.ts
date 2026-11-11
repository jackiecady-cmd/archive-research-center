import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPrintDocument, escapeHtml } from "../../archive-research-center/src/lib/print-html.ts";

test("print HTML escapes titles and layer text", () => {
  assert.equal(escapeHtml(`<img src=x onerror=alert(1)>`), "&lt;img src=x onerror=alert(1)&gt;");
  const html = buildPrintDocument(
    `</title><script>alert("title")</script>`,
    "# <script>alert(1)</script>\n\nA **bold** <b>tag</b>",
  );
  assert.equal(html.includes("<script>"), false);
  assert.match(html, /&lt;script&gt;alert\(&quot;title&quot;\)&lt;\/script&gt;/);
  assert.match(html, /<h1>&lt;script&gt;alert\(1\)&lt;\/script&gt;<\/h1>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /&lt;b&gt;tag&lt;\/b&gt;/);
});
