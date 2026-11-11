import { createElement } from "react";
import { TRANSLATION_DISCLOSURE } from "@workspace/config";

/** Static label only. No assistance panel, machine translation, or model name. */
export function TranslationDisclosure() {
  return createElement(
    "p",
    {
      className: "text-sm text-muted-foreground border border-border rounded-md px-3 py-2 leading-relaxed",
      "data-testid": "translation-disclosure",
    },
    TRANSLATION_DISCLOSURE,
  );
}
