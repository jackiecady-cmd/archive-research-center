# Cookie and tracking notice

**DRAFT FOR ATTORNEY REVIEW — not legal advice.**  
This draft was prepared on 11 November 2026, America/Chicago. It is not in force. Bracketed items in `[LIKE THIS]` must be filled by Jacqueline or counsel. Do not publish this text as a live notice until counsel has reviewed it and Jacqueline has approved it.

**Effective date:** [EFFECTIVE DATE]  
**Operator:** [LEGAL ENTITY NAME]  
**Contact:** [CONTACT EMAIL]

---

## What this draft records

A review of the site source found no analytics, advertising pixels, or tag-manager scripts. Inter and Playfair Display are stored in this repository and loaded from the same origin. The browser does not request fonts from Google or from any other font host.

No third-party network host was found in the site HTML, CSS, or application fetch calls. [IF A LATER AUDIT FINDS MORE HOSTS, NAME THEM HERE.]

## Browser storage

These are the keys the application code sets:

- Cookie `arc_session`. HttpOnly session cookie set by the API so a signed-in browser stays signed in.
- Cookie `sidebar_state`. Set in the browser to remember whether the sidebar is open.
- `localStorage` key `arc_translation_<user id>_<source id>`. A local copy of the signed-in researcher's translation-workspace layers.
- `sessionStorage` key `arc_concierge_profile_v1`. The concierge profile for the current tab.

[COUNSEL TO DECIDE WHETHER THIS STORAGE REQUIRES A CONSENT BANNER.]
