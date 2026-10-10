# garden-planner-landing--page
LAnding page for the garden planner app

## Autumn homepage redesign (10 October 2026)

The homepage uses `assets/home-autumn.css` and `assets/home-autumn.js`. The product screenshot tabs support mouse, touch, Left/Right arrow keys, Home, and End. Today and Plants use responsive desktop/mobile captures. Patch uses the closer mobile capture on both screen sizes, so the planted bed is clearly visible.

The hero's screenshot label occupies its own row above the caption, so neither text block overlaps as the screen width or text wrapping changes.

Homepage and Tips call-to-action buttons use soft layered shadows, stronger hover shadows, and a pressed state. Screenshot tabs also have subtle depth, with a stronger shadow on the active tab.

The homepage has a short hero entrance, one-time scroll reveals with small card staggers, and a soft transition between screenshot tabs. IntersectionObserver triggers the reveals, including asynchronously loaded blog cards and newly selected screenshot panels. Content is visible by default if JavaScript or observer support is unavailable. Motion respects reduced-motion preferences, including changes while the page is open, and stops on keyboard focus so controls remain clear.

The Plants panel frames both captures to exclude the 15-pixel browser scrollbar along their right edge. The screenshot content retains its original proportions.

The Plants tab also shows the user-supplied Basil organic growing guide (`cozygrow-organic-guide-supplied.png`). CSS frames the guide itself, excluding the surrounding modal backdrop and captured scrollbar. The copy describes 63 bundled organic guides, verified against `src/lib/starterPlants.ts` and `src/data/plantKnowledgeBase.md` in the app source. AI guide generation requires Premium; Magic Gardener can plan layouts using custom plants and requires an account. These requirements were checked in the app components and `plant-guide` backend source; no paid AI request was made during this landing-page change.

Today and Plants images in `assets/screenshots/` were captured from the actual live app at `https://www.mygardenplanner.app/try` on 10 October 2026, using a newly created anonymous guest garden with its starter plants. No personal account or private garden was used for those captures. The Patch panel uses `cozygrow-patch-mobile-supplied.png`, the screenshot supplied and selected by the user on 10 October 2026. It is displayed at its original aspect ratio, without cropping or stretching, on mobile and desktop. Screens show real app views; they are not generated app mockups. Source features were checked against the local app checkout at `b8925fb7143cd6c7ae20e2f04b7811b51b9307c7` and the live guest experience. Earlier patch captures are retained as source assets.

The main call to action opens `/try`; sign-in opens `/auth`. Copy distinguishes the no-signup guest demo (72 hours) from saving a garden with an account and avoids promising unlimited free features. Blog data, article routes, publishing APIs, analytics, and the PDF remain in place.

The magazine form retains the existing confirmed-subscription/PDF-unlock checks. It opens from both magazine buttons, opens after 700ms for Facebook or `#magazine` entry, and after 30 seconds for other eligible visitors. Dismissal suppresses the pending automatic opening for that session. The dialog traps keyboard focus and restores focus when closed. Its styles are in `assets/magazine-popup.css`.

Validation: local HTTP checks for homepage assets, PDF, tips, privacy, and imprint; browser checks for responsive layout, real mobile image selection, screenshot tabs, keyboard navigation, empty-form validation, and Escape/focus restoration. No real newsletter subscription was submitted. Production deployment is separate from this local redesign.

## Christmas gift teaser (10 October 2026)

The homepage includes a compact Christmas postcard teaser below the hero and demo proof strip. It links to `/christmas?offer=1`, which opens the approved gift offer directly. `christmas.html` and its postcard assets contain the reviewed campaign, including Cozy Garden Advisor. The teaser hides after 6 January 2027, matching the offer deadline.

`GIFT_CHECKOUT_LIVE` stays false until the separate application checkout, terms and payment backend are published and verified. Public gift buttons show "Gift checkout coming soon" and link to an explanation and the free demo; gift details link to the on-page FAQ. Loopback previews retain the draft application checkout at port 8130. The live application's gift purchase route returned its 404 page during the release check on 10 October 2026. Publishing this landing repository does not activate payments.

The postcard preview uses a smaller JPEG exported from the approved Garden + App recipient card. The main offer retains its complete postcard previews and full-size sample images.

## Blog publishing

Articles now live in `assets/blog-posts.json` and render through the shared blog route at `/blog/:slug`. The old article URLs are preserved in `vercel.json` as rewrites to the same renderer.

Use `/write` to log in, draft, and publish a new blog post. The editor route and publishing API require these Vercel environment variables:

- `GITHUB_TOKEN`: GitHub token with contents write access to this repo.
- `EDITOR_PASSWORD`: password required by the `/write` editor.
- `EDITOR_SESSION_SECRET`: optional separate secret for signing the editor session cookie. Defaults to `EDITOR_PASSWORD`.

Optional overrides:

- `GITHUB_REPOSITORY`: defaults to `ruru-maya/garden-planner-landing--page`.
- `GITHUB_BRANCH`: defaults to `main`.
- `POSTS_FILE_PATH`: defaults to `assets/blog-posts.json`.

## Autumn magazine popup

The homepage includes an autumn magazine email popup for Facebook/Meta traffic and ordinary visitors. It posts to the CozyGrow Garden Lovable/Supabase Edge Function `autumn-magazine-subscribe`, which adds the email to the existing Brevo newsletter list and returns the PDF URL.

- PDF: `downloads/cozygrow-garden-autumn-september-november.pdf`
- Popup image: `assets/cozygrow-autumn-magazine-popup.jpg`
- Download URL returned by the endpoint: `https://www.cozygrowgarden.com/downloads/cozygrow-garden-autumn-september-november.pdf`

The popup only confirms a subscription after a successful HTTP response containing `ok: true` and the expected PDF URL. An empty/honeypot response never unlocks the PDF or marks the browser as subscribed. Failed or timed-out requests preserve the entered email and allow retry; duplicate submits are ignored while a request is pending or after confirmed success.

PDF email delivery belongs to the backend. If it returns `emailDelivery: "failed"` or `"suppressed"`, the popup offers the direct PDF and explains that the email could not be sent. A real contact readback and inbox check are needed to verify the complete service.
