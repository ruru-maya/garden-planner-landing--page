const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const COOKIE_NAME = 'cozygrow_write_session';
const SESSION_LABEL = 'cozygrow-write-editor';
const templatePath = path.join(process.cwd(), 'api', 'write-template.html');

function html(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''));
  const right = Buffer.from(String(b ?? ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function sessionSecret() {
  return process.env.EDITOR_SESSION_SECRET || process.env.EDITOR_PASSWORD || '';
}

function sessionValue() {
  const secret = sessionSecret();
  if (!secret) return '';
  return crypto.createHmac('sha256', secret).update(SESSION_LABEL).digest('hex');
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return index === -1 ? [part, ''] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function hasValidSession(req) {
  const expected = sessionValue();
  const actual = parseCookies(req)[COOKIE_NAME];
  return Boolean(expected && actual && safeEqual(actual, expected));
}

function secureCookie(req) {
  const proto = req.headers['x-forwarded-proto'];
  return proto ? proto !== 'http' : process.env.NODE_ENV === 'production';
}

function sessionCookie(req) {
  const secure = secureCookie(req) ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(sessionValue())}; Max-Age=28800; Path=/; HttpOnly; SameSite=Strict${secure}`;
}

function clearCookie(req) {
  const secure = secureCookie(req) ? '; Secure' : '';
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict${secure}`;
}

function loginPage({ error = '', configured = true } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Editor Login - CozyGrow Garden</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root{--bg:#fdf9f3;--panel:#fff;--primary:#154212;--accent:#9f402d;--text:#2c2c2a;--muted:#6b6b66;--border:#e8e2d8;--head:'Newsreader',Georgia,serif;--body:'Plus Jakarta Sans',system-ui,sans-serif}
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--text);font-family:var(--body);line-height:1.6;padding:1.25rem}
    main{width:min(100%,420px);background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:2rem}
    a{color:var(--primary);font-weight:700;text-decoration:none}
    h1{font-family:var(--head);font-size:2rem;font-weight:500;color:var(--primary);line-height:1.1;margin-bottom:.65rem}
    p{color:var(--muted);margin-bottom:1.25rem}
    label{display:block;font-size:.78rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-bottom:.35rem}
    input{width:100%;border:1px solid var(--border);border-radius:8px;background:#fff;color:var(--text);font:inherit;padding:.8rem .9rem;margin-bottom:1rem}
    input:focus{outline:none;border-color:rgba(21,66,18,.45);box-shadow:0 0 0 3px rgba(21,66,18,.08)}
    button{width:100%;border:0;border-radius:8px;padding:.8rem 1rem;background:var(--primary);color:#fff;font:inherit;font-weight:700;cursor:pointer}
    .error{color:var(--accent);font-weight:700;margin-bottom:1rem}
    .footer{font-size:.85rem;margin-top:1rem;margin-bottom:0}
  </style>
</head>
<body>
  <main>
    <h1>Editor login</h1>
    ${configured ? '<p>Enter the editor password to open the blog writer.</p>' : '<p>The editor is not configured yet. Add <strong>EDITOR_PASSWORD</strong> in Vercel Environment Variables, then redeploy.</p>'}
    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
    ${configured ? `<form method="post" action="/write">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
      <button type="submit">Open editor</button>
    </form>` : ''}
    <p class="footer"><a href="/tips">Back to tips</a></p>
  </main>
</body>
</html>`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 20_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(querystring.parse(data)));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  const configured = Boolean(process.env.EDITOR_PASSWORD);

  if (req.method === 'GET') {
    if (req.query?.logout) {
      res.statusCode = 303;
      res.setHeader('Set-Cookie', clearCookie(req));
      res.setHeader('Location', '/write');
      res.end();
      return;
    }

    if (!configured) {
      html(res, 503, loginPage({ configured: false }));
      return;
    }

    if (!hasValidSession(req)) {
      html(res, 401, loginPage());
      return;
    }

    html(res, 200, fs.readFileSync(templatePath, 'utf8'));
    return;
  }

  if (req.method === 'POST') {
    if (!configured) {
      html(res, 503, loginPage({ configured: false }));
      return;
    }

    const body = await readBody(req);
    if (!safeEqual(body.password, process.env.EDITOR_PASSWORD)) {
      html(res, 401, loginPage({ error: 'Invalid password.' }));
      return;
    }

    res.statusCode = 303;
    res.setHeader('Set-Cookie', sessionCookie(req));
    res.setHeader('Location', '/write');
    res.end();
    return;
  }

  res.statusCode = 405;
  res.setHeader('Allow', 'GET, POST');
  res.end('Method not allowed');
};
