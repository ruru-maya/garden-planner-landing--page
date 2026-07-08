const fs = require('fs');
const path = require('path');

const LOCAL_POSTS_PATH = path.join(process.cwd(), 'assets', 'blog-posts.json');
const DEFAULT_REPO = 'ruru-maya/garden-planner-landing--page';
const DEFAULT_BRANCH = 'main';
const POSTS_FILE = 'assets/blog-posts.json';

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

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

function normalizeUrl(value, fallback = '') {
  const url = String(value ?? '').trim();
  if (!url) return fallback;
  if (url.startsWith('/') || /^https?:\/\//i.test(url)) return url.replace('https://www.www.', 'https://www.');
  return fallback;
}

function localPosts() {
  return JSON.parse(fs.readFileSync(LOCAL_POSTS_PATH, 'utf8'));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (req.body && typeof req.body === 'string') return Promise.resolve(JSON.parse(req.body));
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2_000_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function buildPost(input) {
  const title = String(input.title ?? '').trim();
  const description = String(input.description ?? input.excerpt ?? '').trim();
  const bodyMarkdown = String(input.bodyMarkdown ?? input.body ?? '').trim();
  const slug = slugify(input.slug || title);

  if (!title) throw new Error('Title is required.');
  if (!description) throw new Error('Description is required.');
  if (!bodyMarkdown) throw new Error('Article body is required.');
  if (!slug) throw new Error('Slug is required.');

  return {
    slug,
    title,
    description,
    excerpt: String(input.excerpt ?? description).trim(),
    category: String(input.category ?? 'Gardening Tips').trim(),
    readTime: String(input.readTime ?? '3 min read').trim(),
    datePublished: String(input.datePublished ?? new Date().toISOString().slice(0, 10)).trim(),
    keywords: String(input.keywords ?? '').trim(),
    image: normalizeUrl(input.image, ''),
    imageAlt: String(input.imageAlt ?? title).trim(),
    contentHtml: markdownToHtml(bodyMarkdown),
    cta: {
      text: String(input.cta?.text ?? 'Ready to plan your best garden yet?').trim(),
      href: normalizeUrl(input.cta?.href, 'https://www.mygardenplanner.app'),
      label: String(input.cta?.label ?? 'Start planning your garden ->').trim(),
    },
  };
}

async function fetchPostsFromGitHub({ repo, branch, filePath, token }) {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'cozygrow-blog-editor',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub read failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return { posts: JSON.parse(content), sha: data.sha };
}

async function updatePostsOnGitHub({ repo, branch, filePath, token, posts, sha, title }) {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'cozygrow-blog-editor',
    },
    body: JSON.stringify({
      message: `Add blog post: ${title}`,
      branch,
      sha,
      content: Buffer.from(`${JSON.stringify(posts, null, 2)}\n`, 'utf8').toString('base64'),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub update failed: ${response.status} ${text}`);
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    json(res, 200, localPosts());
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const expectedPassword = process.env.EDITOR_PASSWORD;

  if (!token || !expectedPassword) {
    json(res, 503, {
      error: 'Publishing is not configured. Set GITHUB_TOKEN and EDITOR_PASSWORD in Vercel.',
    });
    return;
  }

  try {
    const payload = await readBody(req);
    if (payload.password !== expectedPassword) {
      json(res, 401, { error: 'Invalid editor password.' });
      return;
    }

    const post = buildPost(payload.post || payload);
    const repo = process.env.GITHUB_REPOSITORY || DEFAULT_REPO;
    const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
    const filePath = process.env.POSTS_FILE_PATH || POSTS_FILE;
    const current = await fetchPostsFromGitHub({ repo, branch, filePath, token });
    const posts = current.posts.filter((item) => item.slug !== post.slug);
    posts.unshift(post);

    const result = await updatePostsOnGitHub({
      repo,
      branch,
      filePath,
      token,
      posts,
      sha: current.sha,
      title: post.title,
    });

    json(res, 201, {
      ok: true,
      slug: post.slug,
      url: `/blog/${post.slug}`,
      commit: result.commit?.sha || null,
    });
  } catch (error) {
    json(res, 400, { error: error.message || 'Unable to publish post.' });
  }
};
