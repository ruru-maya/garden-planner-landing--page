(function () {
  const POSTS_URL = "/blog-posts.json";
  const SITE_URL = "https://cozygrowgarden.com";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function postUrl(post) {
    return `/blog/${encodeURIComponent(post.slug)}`;
  }

  function arrowIcon() {
    return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  }

  async function loadPosts() {
    const response = await fetch(POSTS_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load blog posts.");
    return response.json();
  }

  function cardMeta(post) {
    return {
      category: post.cardCategory || post.category || "Gardening Tips",
      readTime: post.cardReadTime || post.readTime || "",
      title: post.cardTitle || post.title || "Untitled post",
      excerpt: post.excerpt || post.description || "",
      image: post.cardImage || post.image || "",
      imageAlt: post.cardImageAlt || post.imageAlt || post.title || "Garden article image"
    };
  }

  function renderHomeCard(post) {
    const meta = cardMeta(post);
    return `
      <a href="${postUrl(post)}" class="article-card">
        <div class="article-card__img">
          <img src="${escapeHtml(meta.image)}" alt="${escapeHtml(meta.imageAlt)}" loading="lazy" />
        </div>
        <div class="article-card__body">
          <div class="article-card__category">${escapeHtml(meta.category)}</div>
          <h3 class="article-card__title">${escapeHtml(meta.title)}</h3>
          <p class="article-card__excerpt">${escapeHtml(meta.excerpt)}</p>
          <span class="article-card__link">Read article ${arrowIcon()}</span>
        </div>
      </a>`;
  }

  function renderListCard(post) {
    const meta = cardMeta(post);
    return `
      <a href="${postUrl(post)}" class="article-card">
        <div class="article-card__img">
          <img src="${escapeHtml(meta.image)}" alt="${escapeHtml(meta.imageAlt)}" loading="lazy" />
        </div>
        <div class="article-card__body">
          <div class="article-card__meta">
            <span class="article-card__category">${escapeHtml(meta.category)}</span>
            ${meta.readTime ? '<span class="article-card__dot">&middot;</span>' : ""}
            ${meta.readTime ? `<span class="article-card__read">${escapeHtml(meta.readTime)}</span>` : ""}
          </div>
          <h2 class="article-card__title">${escapeHtml(meta.title)}</h2>
          <p class="article-card__excerpt">${escapeHtml(meta.excerpt)}</p>
          <span class="article-card__link">Read article ${arrowIcon()}</span>
        </div>
      </a>`;
  }

  function renderGrids(posts) {
    document.querySelectorAll("[data-blog-grid]").forEach((grid) => {
      const visiblePosts = posts.filter((post) => post.listed !== false);
      const limit = Number(grid.dataset.blogLimit || visiblePosts.length);
      const variant = grid.dataset.blogGrid;
      const render = variant === "home" ? renderHomeCard : renderListCard;
      const selectedPosts = visiblePosts.slice(0, limit);
      grid.innerHTML = selectedPosts.length
        ? selectedPosts.map(render).join("")
        : '<p class="empty-state">No articles have been published yet.</p>';
    });
  }

  function setMeta(selector, value, attrName) {
    const node = document.querySelector(selector);
    if (node && value) node.setAttribute(attrName || "content", value);
  }

  function currentSlug() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("slug")) return params.get("slug");
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "blog" && parts[1]) return decodeURIComponent(parts[1]);
    if (parts[0] && parts[0] !== "post") return decodeURIComponent(parts[0]);
    return "";
  }

  function renderPost(posts) {
    const root = document.querySelector("[data-post-page]");
    if (!root) return;
    const slug = currentSlug();
    const post = posts.find((item) => item.slug === slug);
    const notFound = document.querySelector("[data-post-not-found]");
    if (!post) {
      root.hidden = true;
      if (notFound) notFound.hidden = false;
      return;
    }

    const url = `${SITE_URL}${postUrl(post)}`;
    document.title = `${post.title} - CozyGrow Garden`;
    setMeta('meta[name="description"]', post.description);
    setMeta('link[rel="canonical"]', url, "href");
    setMeta('meta[property="og:title"]', post.title);
    setMeta('meta[property="og:description"]', post.description);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[property="og:image"]', post.image);
    setMeta('meta[name="twitter:title"]', post.title);
    setMeta('meta[name="twitter:description"]', post.description);
    setMeta('meta[name="twitter:image"]', post.image);

    document.querySelector("[data-post-category]").textContent = post.category || "Gardening Tips";
    document.querySelector("[data-post-read]").textContent = post.readTime || post.cardReadTime || "";
    document.querySelector("[data-post-title]").textContent = post.title;
    const hero = document.querySelector("[data-post-image]");
    hero.src = post.image;
    hero.alt = post.imageAlt || post.title;
    document.querySelector("[data-post-body]").innerHTML = post.bodyHtml || "";

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      image: post.image,
      url,
      author: { "@type": "Organization", name: "CozyGrow Garden", url: SITE_URL },
      publisher: { "@type": "Organization", name: "CozyGrow Garden" },
      datePublished: post.datePublished || undefined,
      keywords: post.keywords || undefined
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }

  function boot() {
    loadPosts()
      .then((posts) => {
        renderGrids(posts);
        renderPost(posts);
      })
      .catch((error) => {
        document.querySelectorAll("[data-blog-grid]").forEach((grid) => {
          grid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
        });
        const notFound = document.querySelector("[data-post-not-found]");
        if (notFound) {
          notFound.hidden = false;
          notFound.querySelector("p").textContent = error.message;
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
