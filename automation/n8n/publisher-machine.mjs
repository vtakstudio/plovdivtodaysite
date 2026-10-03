// Pure state transitions. The n8n HTTP Request node owns all networking/auth.
// One article per sub-workflow call keeps revision state isolated.
const BASE = 'https://plovdivtodaysite.estudio-5ba.workers.dev';
const API = BASE + '/_emdash/api';
const BYLINE = '01M3WACKKYR8PKDR9XAX91FF4W';
const FIELDS = ['title', 'excerpt', 'content', 'source_name', 'source_url', 'featured', 'breaking', 'featured_image'];
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const stable = (v) => JSON.stringify(v, (_, x) => x && !Array.isArray(x) && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
const same = (a, b) => stable(a) === stable(b);
const flatten = (terms) => terms.flatMap(t => [t, ...flatten(t.children || [])]);
function fail(s, code, message, retryable = false) {
  return { done: true, result: { success: false, story_key: s.p?.story_key ?? null, ...(s.id ? { emdash_id: s.id } : {}), code, message, retryable } };
}
function request(s, step, method, path, body) {
  return { done: false, state: { ...s, step, calls: (s.calls || 0) + 1 }, request: { method, url: API + path, ...(body === undefined ? {} : { body }) } };
}
const entry = s => '/content/articles/' + encodeURIComponent(s.id);
function validate(p) {
  if (!p || Array.isArray(p) || typeof p !== 'object') return 'Expected one Article Payload v1 object';
  const allowed = ['story_key', ...FIELDS, 'category', 'locations', 'publish_mode'];
  if (Object.keys(p).some(k => !allowed.includes(k))) return 'Unknown Article Payload v1 field';
  if (typeof p.story_key !== 'string' || !p.story_key.trim() || p.story_key !== p.story_key.trim() || p.story_key.length > 200) return 'story_key must be a stable non-empty string (max 200 characters, no surrounding whitespace)';
  if (typeof p.title !== 'string' || !p.title.trim()) return 'title is required';
  if (p.publish_mode !== undefined && !['draft', 'publish'].includes(p.publish_mode)) return 'publish_mode must be draft or publish';
  for (const k of ['excerpt', 'source_name']) if (own(p, k) && typeof p[k] !== 'string' && !(k === 'source_name' && p[k] === null)) return k + ' must be text';
  if (own(p, 'source_url') && p.source_url !== null) {
    if (typeof p.source_url !== 'string' || !/^https?:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/.test(p.source_url)) return 'source_url must be an absolute HTTP(S) URL or null';
  }
  for (const k of ['featured', 'breaking']) if (own(p, k) && typeof p[k] !== 'boolean') return k + ' must be boolean';
  if (own(p, 'category') && (typeof p.category !== 'string' || !p.category)) return 'category must be an existing term slug';
  if (own(p, 'locations') && (!Array.isArray(p.locations) || p.locations.some(x => typeof x !== 'string' || !x) || new Set(p.locations).size !== p.locations.length)) return 'locations must contain distinct existing term slugs';
  if (p.featured_image !== undefined && p.featured_image !== null && (typeof p.featured_image !== 'object' || Array.isArray(p.featured_image) || !/^[0-9A-HJKMNP-TV-Z]{26}$/.test(p.featured_image.id || '') || typeof p.featured_image.provider !== 'string')) return 'featured_image must be null or an existing EmDash media reference with id/provider';
  if (!Array.isArray(p.content) || !p.content.length) return 'content must be a non-empty Portable Text array';
  const keys = new Set();
  for (const b of p.content) {
    if (!b || b._type !== 'block' || typeof b._key !== 'string' || !b._key || keys.has(b._key) || !['normal', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'].includes(b.style || 'normal') || !Array.isArray(b.children) || !b.children.length || !Array.isArray(b.markDefs || [])) return 'Invalid Portable Text block';
    keys.add(b._key);
    if (b.listItem !== undefined && (!['bullet', 'number'].includes(b.listItem) || !Number.isInteger(b.level) || b.level < 1)) return 'Invalid Portable Text list';
    const defs = new Set();
    for (const d of b.markDefs || []) {
      if (!d || d._type !== 'link' || typeof d._key !== 'string' || !d._key || defs.has(d._key) || typeof d.href !== 'string' || !/^(https?:\/\/|mailto:|\/[^/]|#)/.test(d.href)) return 'Invalid Portable Text link';
      defs.add(d._key);
    }
    const childKeys = new Set();
    for (const c of b.children) {
      if (!c || c._type !== 'span' || typeof c._key !== 'string' || !c._key || childKeys.has(c._key) || typeof c.text !== 'string' || !Array.isArray(c.marks || []) || (c.marks || []).some(m => !['strong', 'em', 'code', 'underline', 'strike-through'].includes(m) && !defs.has(m))) return 'Invalid Portable Text span or mark';
      childKeys.add(c._key);
    }
  }
  return null;
}
function data(p) { return Object.fromEntries(['story_key', ...FIELDS].filter(k => own(p, k)).map(k => [k, p[k]])); }
function assignments(p) {
  return { ...(own(p, 'category') ? { category: [p.category] } : {}), ...(own(p, 'locations') ? { location: p.locations } : {}) };
}
function snapshot(item) { return { data: item.data, bylines: item.bylines, status: item.status, scheduledAt: item.scheduledAt, liveRevisionId: item.liveRevisionId }; }
function write(s) {
  const body = { data: data(s.p), _rev: s.rev };
  const taxonomies = assignments(s.p);
  if (Object.keys(taxonomies).length) body.taxonomies = taxonomies;
  return request(s, 'update', 'PUT', entry(s), body);
}
function lock(s, next) { return request({ ...s, next }, 'lock', 'GET', entry(s) + '/lock'); }
function final(s, item) {
  return { done: true, result: { success: true, action: s.action, story_key: s.p.story_key, emdash_id: item.id, slug: item.slug, status: s.p.publish_mode === 'publish' ? 'published' : 'draft', public_url: item.status === 'published' ? BASE + '/novini/' + encodeURIComponent(item.slug) + '/' : null } };
}
export function transition(input) {
  if (!input || !own(input, 'state')) {
    const p = input;
    const problem = validate(p);
    if (problem) return fail({ p }, 'VALIDATION_ERROR', problem);
    const s = { p: { ...p, publish_mode: p.publish_mode ?? 'draft' }, retries: 0 };
    return request(s, 'categories', 'GET', '/taxonomies/category/terms?locale=bg&includeCounts=false');
  }
  let s = input.state;
  if (s.calls > 24) return fail(s, 'REQUEST_LIMIT', 'Publisher request budget exceeded');
  const r = input.response;
  const envelope = r?.body;
  if (!r || !Number.isInteger(r.statusCode) || !envelope || typeof envelope.success !== 'boolean') return fail(s, 'TRANSPORT_ERROR', 'EmDash did not return a valid API response', true);
  if (!envelope.success || r.statusCode >= 400) {
    const e = envelope.error || {};
    if (e.code === 'CONFLICT' && ['update', 'publish'].includes(s.step) && s.retries === 0) return request({ ...s, retries: 1, retryOperation: s.step }, 'retryRead', 'GET', entry(s));
    if (s.step === 'create' && ['CONFLICT', 'CONTENT_CREATE_ERROR'].includes(e.code)) return request({ ...s, createError: { code: e.code, message: e.message, status: r.statusCode } }, 'recoverLookup', 'GET', '/content/articles?status=all&limit=2&fieldFilters=' + encodeURIComponent(JSON.stringify({ story_key: s.p.story_key })));
    return fail(s, e.code || 'HTTP_ERROR', e.message || 'EmDash request failed', e.code === 'ENTRY_LOCKED' || e.code === 'CONFLICT' || r.statusCode === 429 || r.statusCode >= 500);
  }
  const d = envelope.data;
  if (s.step === 'categories') {
    if (!Array.isArray(d?.terms)) return fail(s, 'API_CONTRACT_ERROR', 'Missing category terms');
    const term = own(s.p, 'category') ? flatten(d.terms).find(t => t.slug === s.p.category && t.locale === 'bg') : null;
    if (own(s.p, 'category') && !term) return fail(s, 'VALIDATION_ERROR', 'Unknown category: ' + s.p.category);
    s = { ...s, categoryId: term?.id };
    return request(s, 'locations', 'GET', '/taxonomies/location/terms?locale=bg&includeCounts=false');
  }
  if (s.step === 'locations') {
    if (!Array.isArray(d?.terms)) return fail(s, 'API_CONTRACT_ERROR', 'Missing location terms');
    const terms = flatten(d.terms);
    const ids = [];
    for (const slug of s.p.locations || []) {
      const term = terms.find(t => t.slug === slug && t.locale === 'bg');
      if (!term) return fail(s, 'VALIDATION_ERROR', 'Unknown location: ' + slug);
      ids.push(term.id);
    }
    return request({ ...s, locationIds: ids }, 'lookup', 'GET', '/content/articles?status=all&limit=2&fieldFilters=' + encodeURIComponent(JSON.stringify({ story_key: s.p.story_key })));
  }
  if (['lookup', 'recoverLookup'].includes(s.step)) {
    if (!Array.isArray(d?.items) || typeof d.total !== 'number') return fail(s, 'API_CONTRACT_ERROR', 'Invalid exact lookup response');
    if (d.total > 1 || d.items.length > 1) return fail(s, 'DUPLICATE_STORY_KEY', 'More than one article reserves this story_key');
    const existing = d.items[0];
    if (s.step === 'recoverLookup') {
      if (existing) return fail({ ...s, id: existing.id }, 'STORY_KEY_CONFLICT', 'Another run already reserves this story_key; retry the publisher lookup', true);
      return fail(s, s.createError.code, s.createError.message + '; the key may be reserved in Trash. No create retry was attempted', s.createError.status >= 500 || s.createError.code === 'CONFLICT');
    }
    if (existing) {
      if (existing.data.story_key !== s.p.story_key || existing.locale !== 'bg') return fail(s, 'STORY_KEY_CONFLICT', 'The key belongs to a different entry/locale');
      return request({ ...s, id: existing.id, action: 'updated' }, 'get', 'GET', '/content/articles/' + encodeURIComponent(existing.id));
    }
    if (typeof s.p.excerpt !== 'string' || !s.p.excerpt.trim() || !s.categoryId) return fail(s, 'VALIDATION_ERROR', 'New articles require excerpt and category');
    return request({ ...s, action: 'created' }, 'create', 'POST', '/content/articles', { data: data(s.p), status: 'draft', locale: 'bg', bylines: [{ bylineId: BYLINE }] });
  }
  if (['get', 'retryRead', 'ready', 'verifyPublished'].includes(s.step)) {
    if (!d?.item || typeof d._rev !== 'string' || d.item.data.story_key !== s.p.story_key) return fail(s, 'API_CONTRACT_ERROR', 'Entry identity or revision missing');
    const item = d.item;
    if (s.step === 'verifyPublished') {
      if (d._rev !== s.publishedRev) return fail(s, 'CONFLICT', 'Entry changed after publication', true);
      if (item.status !== 'published' || item.draftRevisionId) return fail(s, 'READBACK_MISMATCH', 'Publish did not produce the expected live revision');
      return final(s, item);
    }
    if (s.step === 'get') return lock({ ...s, rev: d._rev, baseline: snapshot(item) }, 'update');
    if (s.step === 'retryRead') {
      const expected = s.retryOperation === 'update' ? s.baseline : s.readySnapshot;
      if (!same(snapshot(item), expected)) return fail(s, 'CONFLICT', 'Entry changed substantively; refusing to overwrite or publish another editor’s changes', true);
      return lock({ ...s, rev: d._rev }, s.retryOperation);
    }
    // Readback must still match our write token. A fresh read is not permission
    // to publish a draft changed by another writer after our own save.
    if (d._rev !== s.writtenRev) return fail(s, 'CONFLICT', 'Entry changed after the publisher saved it', true);
    s = { ...s, rev: d._rev, readySnapshot: snapshot(item) };
    if (s.p.publish_mode === 'draft') return final(s, item);
    return lock(s, 'publish');
  }
  if (s.step === 'lock') {
    if (!d || !own(d, 'holder')) return fail(s, 'API_CONTRACT_ERROR', 'Missing edit-lock status');
    // Any editor lock takes precedence, including a browser using the PAT owner's account.
    if (d.holder) return fail(s, 'ENTRY_LOCKED', 'An editor holds this entry; automation will not override the lock', true);
    if (s.next === 'update') return write(s);
    if (s.next === 'publish') return request(s, 'publish', 'POST', entry(s) + '/publish', { _rev: s.rev });
    if (s.next === 'category') return request(s, 'category', 'POST', entry(s) + '/terms/category', { termIds: [s.categoryId] });
    return request(s, 'location', 'POST', entry(s) + '/terms/location', { termIds: s.locationIds });
  }
  if (s.step === 'create') {
    if (!d?.item?.id || typeof d._rev !== 'string' || d.item.status !== 'draft') return fail(s, 'API_CONTRACT_ERROR', 'Create did not return a draft and revision');
    return lock({ ...s, id: d.item.id, writtenRev: d._rev }, 'category');
  }
  if (s.step === 'category') {
    if (own(s.p, 'locations')) return lock(s, 'location');
    return request(s, 'ready', 'GET', entry(s));
  }
  if (s.step === 'location') return request(s, 'ready', 'GET', entry(s));
  if (s.step === 'update') {
    if (!d?.item || typeof d._rev !== 'string') return fail(s, 'API_CONTRACT_ERROR', 'Update response lacks revision');
    return request({ ...s, writtenRev: d._rev }, 'ready', 'GET', entry(s));
  }
  if (s.step === 'publish') {
    if (!d?.item || typeof d._rev !== 'string') return fail(s, 'API_CONTRACT_ERROR', 'Publish response lacks revision');
    return request({ ...s, publishedRev: d._rev }, 'verifyPublished', 'GET', entry(s));
  }
  return fail(s, 'API_CONTRACT_ERROR', 'Unknown publisher state');
}
