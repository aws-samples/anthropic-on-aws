import { Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { PORTAL_HTML, PORTAL_JS } from './site.js';

// PORTAL_JS is the entire browser-side script, embedded as a JS template
// literal inside site.ts. That nesting is a real footgun: an escape
// sequence like `\n` written directly in the outer template literal is
// consumed by *that* literal's own parsing, landing as a literal newline
// inside what was meant to be a single-quoted string in the *browser*
// script -- which then fails to parse in the browser with "Invalid or
// unexpected token". This exact bug shipped once (a raw newline broke the
// developer-shell bootstrap command in the Sign-in flow, silently killing
// every click handler because the whole script failed to load) and was
// only caught by a live browser test, not by `npm test`. Anything meant
// to appear literally in the nested script must be double-escaped (e.g.
// `\\n`) in site.ts. This test exists so a broken PORTAL_JS fails fast in
// CI instead of shipping to prod.
describe('portal/site.ts embedded browser script', () => {
  it('PORTAL_JS parses as syntactically valid JavaScript', () => {
    expect(() => new Script(PORTAL_JS)).not.toThrow();
  });

  it('PORTAL_HTML references the same script/style filenames the API serves', () => {
    expect(PORTAL_HTML).toContain('app.js');
    expect(PORTAL_HTML).toContain('terminal-vendor.js');
    expect(PORTAL_HTML).toContain('xterm.css');
  });
});
