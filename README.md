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
