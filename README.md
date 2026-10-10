# garden-planner-landing--page
LAnding page for the garden planner app

## Autumn homepage redesign (10 October 2026)

The homepage uses `assets/home-autumn.css` and `assets/home-autumn.js`. The product screenshot tabs support mouse, touch, Left/Right arrow keys, Home, and End. Today and Plants use responsive desktop/mobile captures. Patch uses the closer mobile capture on both screen sizes, so the planted bed is clearly visible.

Today and Plants images in `assets/screenshots/` were captured from the actual live app at `https://www.mygardenplanner.app/try` on 10 October 2026, using a newly created anonymous guest garden with its starter plants. No personal account or private garden was used for those captures. The Patch panel uses `cozygrow-patch-mobile-supplied.png`, the screenshot supplied and selected by the user on 10 October 2026. It is displayed at its original aspect ratio, without cropping or stretching, on mobile and desktop. Screens show real app views; they are not generated app mockups. Source features were checked against the local app checkout at `b8925fb7143cd6c7ae20e2f04b7811b51b9307c7` and the live guest experience. Earlier patch captures are retained as source assets.

The main call to action opens `/try`; sign-in opens `/auth`. Copy distinguishes the no-signup guest demo (72 hours) from saving a garden with an account and avoids promising unlimited free features. Blog data, article routes, publishing APIs, analytics, and the PDF remain in place.

The magazine form retains the existing confirmed-subscription/PDF-unlock checks. It opens from both magazine buttons, opens after 700ms for Facebook or `#magazine` entry, and after 30 seconds for other eligible visitors. Dismissal suppresses the pending automatic opening for that session. The dialog traps keyboard focus and restores focus when closed. Its styles are in `assets/magazine-popup.css`.

Validation: local HTTP checks for homepage assets, PDF, tips, privacy, and imprint; browser checks for responsive layout, real mobile image selection, screenshot tabs, keyboard navigation, empty-form validation, and Escape/focus restoration. No real newsletter subscription was submitted. Production deployment is separate from this local redesign.

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
