# garden-planner-landing--page
LAnding page for the garden planner app

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
