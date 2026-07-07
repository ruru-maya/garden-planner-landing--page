(function () {
  const POSTS_PATH = '/assets/blog-posts.json';
  const arrowIcon = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  let cachedPosts = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugify(value) {
    return String(value ?? '')
      .toLowerCase()
      .trim()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function postUrl(post) {
    return `/blog/${encodeURIComponent(post.slug)}`;
  }

  function truncate(value, length) {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    return text.length > length ? `${text.slice(0, length - 1).trim()}...` : text;
  }

  function inlineMarkdown(value) {
    let text = escapeHtml(value);
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
    return text;
  }

  function markdownToHtml(markdown) {
    const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let paragraph = [];
    let list = null;

    function closeParagraph() {
      if (!paragraph.length) return;
      html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    }

    function closeList() {
      if (!list) return;
      html.push(`<${list.type}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</${list.type}>`);
      list = null;
    }

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        closeParagraph();
        closeList();
        continue;
      }

      const heading = line.match(/^(#{2,3})\s+(.+)$/);
      if (heading) {
        closeParagraph();
        closeList();
        const level = heading[1].length;
        html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
        continue;
      }

      const bullet = line.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        closeParagraph();
        if (!list || list.type !== 'ul') {
          closeList();
          list = { type: 'ul', items: [] };
        }
        list.items.push(bullet[1]);
        continue;
      }

      const ordered = line.match(/^\d+\.\s+(.+)$/);
      if (ordered) {
        closeParagraph();
        if (!list || list.type !== 'ol') {
          closeList();
          list = { type: 'ol', items: [] };
        }
        list.items.push(ordered[1]);
        continue;
      }

      closeList();
      paragraph.push(line);
    }

    closeParagraph();
    closeList();
    return html.join('\n');
  }

  async function loadPosts() {
    if (cachedPosts) return cachedPosts;
    const response = await fetch(`${POSTS_PATH}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load blog posts.');
    cachedPosts = await response.json();
    return cachedPosts;
  }

  function renderCard(post, options = {}) {
    const headingLevel = options.headingLevel || 2;
    const revealClass = options.revealClass || '';
    const className = `article-card ${revealClass}`.trim();
    const meta = options.showReadTime === false ? `
          <div class="article-card__category">${escapeHtml(post.category || 'Gardening Tips')}</div>` : `
          <div class="article-card__meta">
            <span class="article-card__category">${escapeHtml(post.category || 'Gardening Tips')}</span>
            <span class="article-card__dot">&middot;</span>
            <span class="article-card__read">${escapeHtml(post.readTime || '3 min read')}</span>
          </div>`;

    return `
      <a href="${postUrl(post)}" class="${className}">
        <div class="article-card__img">
          <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy" />
        </div>
        <div class="article-card__body">
          ${meta}
          <h${headingLevel} class="article-card__title">${escapeHtml(post.title)}</h${headingLevel}>
          <p class="article-card__excerpt">${escapeHtml(truncate(post.excerpt || post.description, options.excerptLength || 170))}</p>
          <span class="article-card__link">Read article ${arrowIcon}</span>
        </div>
      </a>`;
  }

  async function renderGrid(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return [];
    const posts = await loadPosts();
    const visiblePosts = options.limit ? posts.slice(0, options.limit) : posts;
    element.innerHTML = visiblePosts.map((post, index) => renderCard(post, {
      headingLevel: options.headingLevel,
      excerptLength: options.excerptLength,
      showReadTime: options.showReadTime,
      revealClass: options.reveal ? `reveal ${index ? `reveal-d${Math.min(index, 5)}` : ''}`.trim() : '',
    })).join('');
    return visiblePosts;
  }

  function currentSlug() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug') || window.location.pathname.split('/').filter(Boolean).pop() || '';
  }

  function setMeta(selector, value, attr = 'content') {
    const element = document.querySelector(selector);
    if (element && value) element.setAttribute(attr, value);
  }

  async function renderPostPage() {
    const posts = await loadPosts();
    const slug = currentSlug();
    const post = posts.find((item) => item.slug === slug);
    const main = document.querySelector('[data-post-main]');

    if (!post) {
      if (main) {
        main.innerHTML = '<article><h1>Article not found</h1><p>This guide is not available yet.</p><p><a href="/tips">Back to all tips</a></p></article>';
      }
      document.title = 'Article not found - CozyGrow Garden';
      return null;
    }

    document.title = `${post.title} - CozyGrow Garden`;
    setMeta('meta[name="description"]', post.description);
    setMeta('meta[property="og:title"]', post.title);
    setMeta('meta[property="og:description"]', post.description);
    setMeta('meta[property="og:url"]', `${window.location.origin}/blog/${post.slug}`);
    setMeta('meta[property="og:image"]', post.image);
    setMeta('meta[name="twitter:title"]', post.title);
    setMeta('meta[name="twitter:description"]', post.description);
    setMeta('meta[name="twitter:image"]', post.image);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `${window.location.origin}/blog/${post.slug}`;

    const jsonLd = document.querySelector('[data-post-jsonld]');
    if (jsonLd) {
      jsonLd.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.description,
        url: `${window.location.origin}/blog/${post.slug}`,
        image: post.image,
        author: { '@type': 'Organization', name: 'CozyGrow Garden', url: window.location.origin },
        publisher: { '@type': 'Organization', name: 'CozyGrow Garden' },
        datePublished: post.datePublished,
        keywords: post.keywords || '',
      });
    }

    if (main) {
      main.innerHTML = `
        <div class="article-meta">
          <span class="article-category"><a href="/tips">${escapeHtml(post.category || 'Gardening Tips')}</a></span>
          <span class="dot">&middot;</span>
          <span>${escapeHtml(post.readTime || '3 min read')}</span>
        </div>
        <article>
          <h1>${escapeHtml(post.title)}</h1>
          <img class="hero-image" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy">
          ${post.contentHtml || ''}
          ${renderCta(post)}
        </article>`;
    }

    return post;
  }

  function renderCta(post) {
    if (!post.cta || !post.cta.text || !post.cta.href) return '';
    return `
      <div class="cta-card">
        <p>${escapeHtml(post.cta.text)}</p>
        <a href="${escapeHtml(post.cta.href)}" class="cta-button">${escapeHtml(post.cta.label || 'Start planning your garden ->')}</a>
      </div>`;
  }

  window.CozyGrowBlog = {
    POSTS_PATH,
    escapeHtml,
    slugify,
    markdownToHtml,
    loadPosts,
    renderCard,
    renderCta,
    renderGrid,
    renderPostPage,
    postUrl,
  };
})();
