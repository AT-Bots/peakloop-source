// White-label patch for the Postiz source (AGPL-3.0).
// Usage: node whitelabel.mjs <postiz source dir> <brand files dir>
// It changes only what the user sees: name, logos, favicon, accent colours, legal links.
// It keeps LICENSE, copyright notices and code identifiers. It adds a "Source code" link (AGPL section 13).
// Every step checks that it changed something. If Postiz moved a file, the build stops here with a clear message.
import { readFileSync, writeFileSync, copyFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const [app = '/app', brand = '/brand'] = process.argv.slice(2);
const NAME = process.env.BRAND_NAME || 'AT Media Scheduler';
const TAGLINE = process.env.BRAND_TAGLINE || 'AI-Powered Content. Human Impact.';
const SOURCE_URL = process.env.SOURCE_URL || 'https://github.com/AT-Bots/peakloop-source';
const TERMS_URL = process.env.TERMS_URL || 'https://atmediaglobal.com/terms';
const PRIVACY_URL = process.env.PRIVACY_URL || 'https://atmediaglobal.com/privacy';
// Postiz purple, pink and magenta -> AT Media crimson, warm cream and burgundy.
const COLOURS = { '612bd3': 'B40023', fc69ff: 'FCF0D6', d82d7e: '7A0018' };

if (/["'`\\<>{}$]/.test(NAME + TAGLINE)) throw new Error('BRAND_NAME and BRAND_TAGLINE must be plain text');
for (const u of [SOURCE_URL, TERMS_URL, PRIVACY_URL]) if (!/^https:\/\/[\w./~%-]+$/.test(u)) throw new Error(`Not a plain https URL: ${u}`);

const p = (...parts) => join(app, ...parts);
const fail = (msg) => { throw new Error(`whitelabel: ${msg}. Postiz changed this file. Update deploy/postiz/whitelabel.mjs.`); };
function edit(file, fn) {
  if (!existsSync(p(file))) fail(`file not found: ${file}`);
  const before = readFileSync(p(file), 'utf8');
  const after = fn(before);
  if (after === before) fail(`no change made in ${file}`);
  writeFileSync(p(file), after);
}
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|json|scss|css|cjs)$/.test(f)) out.push(full);
  }
  return out;
}

// ---- 1. Logo and favicon files ----
const PUBLIC = 'apps/frontend/public';
const files = {
  'favicon.ico': 'favicon.ico', 'favicon.png': 'favicon.png', 'postiz-fav.png': 'favicon.png',
  'postiz.svg': 'icon.svg', 'logo.svg': 'icon.svg', 'postiz-text.svg': 'logo-dark.svg', 'logo-text.svg': 'logo-dark.svg',
};
for (const [to, from] of Object.entries(files)) {
  if (!existsSync(p(PUBLIC, to))) fail(`file not found: ${PUBLIC}/${to}`);
  copyFileSync(join(brand, from), p(PUBLIC, to));
}

// ---- 2. Logo components (the bars come from branding/mark.svg) ----
const bars = [...readFileSync(join(brand, 'mark.svg'), 'utf8').matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" rx="(\d+)"/g)];
if (bars.length !== 11) throw new Error('branding/mark.svg must have 11 bars');
const rects = (fill) => bars.map(([, x, y, w, h, rx]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" />`).join('\n      ');
edit('apps/frontend/src/components/new-layout/logo.tsx', () => `'use client';

export const Logo = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="-90 -90 960 960" fill="none" className="mt-[8px] min-w-[60px] min-h-[60px]">
      <title>${NAME}</title>
      <rect x="-90" y="-90" width="960" height="960" rx="200" fill="#B40023" />
      ${rects('#FFF8EA')}
    </svg>
  );
};
`);
edit('apps/frontend/src/components/ui/logo-text.component.tsx', () => `import React from 'react';

export const LogoTextComponent = () => {
  return (
    <div className="flex items-center gap-[12px]">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="-90 -90 960 960" fill="none">
        <rect x="-90" y="-90" width="960" height="960" rx="200" fill="#B40023" />
        ${rects('#FFF8EA')}
      </svg>
      <div className="text-[20px] font-[600] tracking-[0.02em]">${NAME}</div>
    </div>
  );
};
`);

// ---- 3. Name and colours in all visible text ----
// Kept as "Postiz": client names sent to other servers, and messages about real Postiz instances.
const KEEP = /(mastodon\.custom|tumblr|wordpress)\.provider\.ts$|mcp\.relay\.service\.ts$/;
const colourRe = new RegExp(`#(${Object.keys(COLOURS).join('|')})\\b`, 'gi');
let names = 0, colours = 0;
for (const dir of ['apps/frontend/src', 'apps/frontend/tailwind.config.cjs', 'libraries/react-shared-libraries/src', 'apps/backend/src', 'apps/orchestrator/src', 'libraries/nestjs-libraries/src', 'libraries/helpers/src']) {
  if (!existsSync(p(dir))) fail(`path not found: ${dir}`);
  for (const file of statSync(p(dir)).isDirectory() ? walk(p(dir)) : [p(dir)]) {
    if (KEEP.test(file)) continue;
    const before = readFileSync(file, 'utf8');
    let after = before.replace(/\bPostiz\b/g, () => (names++, NAME));
    if (relative(app, file).startsWith('apps/frontend') || relative(app, file).startsWith('apps\\frontend') || file.includes('react-shared-libraries'))
      after = after.replace(colourRe, (_, c) => (colours++, '#' + COLOURS[c.toLowerCase()]));
    if (after !== before) writeFileSync(file, after);
  }
}
if (names < 300 || colours < 100) fail(`too few replacements (names ${names}, colours ${colours})`);

// ---- 4. Legal links on the register page ----
edit('apps/frontend/src/components/auth/register.tsx', (s) =>
  s.replace('https://postiz.com/terms', TERMS_URL).replace('https://postiz.com/privacy', PRIVACY_URL));

// ---- 5. Login page: our brand panel in place of the Postiz slogan and testimonials, plus the source link ----
edit('apps/frontend/src/app/(app)/auth/layout.tsx', (s) => {
  const a = s.indexOf('<div className="text-center">');
  const b = s.indexOf('<TestimonialComponent />');
  if (a < 0 || b < a) fail('login page panel not found');
  s = s.slice(0, a) + `<div className="flex-1 flex flex-col items-center justify-center gap-[24px] text-center pb-[88px]">
            <img src="/postiz.svg" width={160} height={160} alt="${NAME}" />
            <div>${TAGLINE}</div>
          </div>` + s.slice(b + '<TestimonialComponent />'.length);
  s = s.replace(/^import \{ TestimonialComponent \}.*\n/m, '');
  const c = '<div className="flex">{children}</div>';
  if (!s.includes(c)) fail('login form slot not found');
  return s.replace(c, `${c}
            <div className="text-[12px] opacity-60">
              Open-source software, AGPL-3.0 license.{' '}
              <a className="underline" href="${SOURCE_URL}" target="_blank" rel="noreferrer">Source code</a>
            </div>`);
});

// ---- 6. Shared preview page: the inline Postiz word logo ----
edit('apps/frontend/src/app/(app)/(preview)/p/[id]/page.tsx', (s) =>
  s.replace(/<svg\s[^>]*viewBox="0 0 366 167"[\s\S]*?<\/svg>/, `<span className="text-[20px] font-[600]">${NAME}</span>`));

console.log(`whitelabel: ok. "${NAME}": ${names} names, ${colours} colours, ${Object.keys(files).length} image files.`);
