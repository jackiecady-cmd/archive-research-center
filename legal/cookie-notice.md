# Cookie and tracking notice

**DRAFT FOR ATTORNEY REVIEW — not legal advice.**  
This draft was prepared on 11 November 2026, America/Chicago. It is not in force. Bracketed items in `[LIKE THIS]` must be filled by Jacqueline or counsel. Do not publish this text as a live notice until counsel has reviewed it and Jacqueline has approved it.

**Effective date:** [EFFECTIVE DATE]  
**Operator:** [LEGAL ENTITY NAME]  
**Contact:** [CONTACT EMAIL]

---

## What this draft records

A review of the site source on 11 November 2026 found no analytics, advertising pixels, or tag-manager scripts.

The browser does request fonts from Google:

- `https://fonts.googleapis.com` (a stylesheet, and a preconnect in `index.html`)
- `https://fonts.gstatic.com` (a preconnect in `index.html`)
- The families requested are Inter and Playfair Display

Those requests are made by `artifacts/archive-research-center/index.html` and by an `@import` in `artifacts/archive-research-center/src/index.css`. Google receives the browser's IP address and the usual request headers when the font files are fetched. This draft does not decide whether that request requires a consent banner. [COUNSEL TO DECIDE WHETHER A CONSENT BANNER IS REQUIRED.]

No other third-party network host was found in the site HTML, CSS, or application fetch calls. [IF A LATER AUDIT FINDS MORE HOSTS, NAME THEM HERE.]

## Cookies

The service sets an httpOnly session cookie named `arc_session` so a signed-in browser stays signed in. [LIST ANY OTHER COOKIE OR LOCAL-STORAGE KEY.]
