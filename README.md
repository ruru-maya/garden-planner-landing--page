# garden-planner-landing--page
LAnding page for the garden planner app

## Blog workflow

Posts are stored in `blog-posts.json` and rendered by `post.html`, so new articles no longer need their own flat HTML files.

- Visit `/write` to draft a post.
- Publish with a GitHub fine-grained token that has Contents read/write access to this repository.
- Public article URLs use `/blog/<slug>`, while the old root article URLs are rewritten to the dynamic post template for compatibility.
