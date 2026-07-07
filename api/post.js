const fs = require('fs');
const path = require('path');

const postsPath = path.join(process.cwd(), 'assets', 'blog-posts.json');
const templatePath = path.join(process.cwd(), 'post.html');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadPosts() {
  return JSON.parse(fs.readFileSync(postsPath, 'utf8'));
}

function siteOrigin(req) {
  const host = req.headers.host || 'www.cozygrowgarden.com';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

function renderCta(post) {
  if (!post.cta || !post.cta.text || !post.cta.href) return '';
  return `
      <div class="cta-card">
        <p>${escapeHtml(post.cta.text)}</p>
        <a href="${escapeHtml(post.cta.href)}" class="cta-button">${escapeHtml(post.cta.label || 'Start planning your garden ->')}</a>
      </div>`;
}

function renderArticle(post) {
  return `
  <main class="article-wrapper" data-post-main>
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
    </article>
  </main>`;
}

function replaceMeta(html, selector, value) {
  const attr = selector.type === 'property' ? 'property' : 'name';
  const key = selector.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta ${attr}="${key}" content="[^"]*">`);
  return html.replace(pattern, `<meta ${attr}="${selector.value}" content="${escapeHtml(value)}">`);
}

function renderPage(req, post) {
  const origin = siteOrigin(req);
  const url = `${origin}/blog/${post.slug}`;
  let html = fs.readFileSync(templatePath, 'utf8');

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(post.title)} - CozyGrow Garden</title>`);
  html = replaceMeta(html, { type: 'name', value: 'description' }, post.description);
  html = replaceMeta(html, { type: 'property', value: 'og:title' }, post.title);
  html = replaceMeta(html, { type: 'property', value: 'og:description' }, post.description);
  html = replaceMeta(html, { type: 'property', value: 'og:url' }, url);
  html = replaceMeta(html, { type: 'property', value: 'og:image' }, post.image);
  html = replaceMeta(html, { type: 'name', value: 'twitter:title' }, post.title);
  html = replaceMeta(html, { type: 'name', value: 'twitter:description' }, post.description);
  html = replaceMeta(html, { type: 'name', value: 'twitter:image' }, post.image);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${escapeHtml(url)}">`);
  html = html.replace(
    /<script type="application\/ld\+json" data-post-jsonld>[\s\S]*?<\/script>/,
    `<script type="application/ld+json" data-post-jsonld>${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      url,
      image: post.image,
      author: { '@type': 'Organization', name: 'CozyGrow Garden', url: origin },
      publisher: { '@type': 'Organization', name: 'CozyGrow Garden' },
      datePublished: post.datePublished,
      keywords: post.keywords || '',
    })}</script>`,
  );
  html = html.replace(/<main class="article-wrapper" data-post-main>[\s\S]*?<\/main>/, renderArticle(post));
  return html;
}

module.exports = function handler(req, res) {
  const slug = req.query.slug || '';
  const post = loadPosts().find((item) => item.slug === slug);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!post) {
    res.statusCode = 404;
    res.end(renderPage(req, {
      slug: 'tips',
      title: 'Article not found',
      description: 'This CozyGrow Garden article is not available.',
      category: 'Gardening Tips',
      readTime: '',
      image: '',
      imageAlt: '',
      datePublished: '2026-04-12',
      keywords: '',
      contentHtml: '<p>This guide is not available yet.</p><p><a href="/tips">Back to all tips</a></p>',
    }));
    return;
  }

  res.statusCode = 200;
  res.end(renderPage(req, post));
};
