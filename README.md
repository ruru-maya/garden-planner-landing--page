# garden-planner-landing--page
LAnding page for the garden planner app

## Blog publishing

Articles now live in `assets/blog-posts.json` and render through the shared blog route at `/blog/:slug`. The old article URLs are preserved in `vercel.json` as rewrites to the same renderer.

Use `/write` to draft and publish a new blog post. Publishing requires these Vercel environment variables:

- `GITHUB_TOKEN`: GitHub token with contents write access to this repo.
- `EDITOR_PASSWORD`: password required by the `/write` editor.

Optional overrides:

- `GITHUB_REPOSITORY`: defaults to `ruru-maya/garden-planner-landing--page`.
- `GITHUB_BRANCH`: defaults to `main`.
- `POSTS_FILE_PATH`: defaults to `assets/blog-posts.json`.
