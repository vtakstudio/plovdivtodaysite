import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { transition } from './publisher-machine.mjs';
const fixture = JSON.parse(await fs.readFile(new URL('../fixtures/article-v1.json', import.meta.url), 'utf8'));
const response = (out, data, statusCode = 200) => transition({ state: out.state, response: { statusCode, body: { success: true, data } } });
const error = (out, code, statusCode = 409) => transition({ state: out.state, response: { statusCode, body: { success: false, error: { code, message: code } } } });
const term = (slug) => ({ id: slug + '-id', slug, locale: 'bg', children: [] });
function lookup(p = fixture) {
  let out = transition(p);
  out = response(out, { terms: [term('plovdiv'), term('trafik')] });
  return response(out, { terms: [{ ...term('plovdiv'), children: [term('tsentralen')] }] });
}
const item = { id: 'article-id', locale: 'bg', slug: 'test', status: 'published', data: { story_key: fixture.story_key, title: 'old' }, bylines: [], liveRevisionId: 'live-id', scheduledAt: null };
function update(p = fixture) {
  let out = response(lookup(p), { total: 1, items: [item] });
  out = response(out, { item, _rev: 'rev-1' });
  return response(out, { holder: null });
}
test('validation rejects missing key/title, invalid content/marks/mode/image and unknown fields before HTTP', () => {
  for (const patch of [{ story_key: '' }, { title: '' }, { content: [] }, { publish_mode: 'published' }, { extra: 1 }, { featured_image: 'url' }, { locations: ['tsentralen', 'tsentralen'] }, { content: [{ _type: 'block', _key: 'x', children: [{ _type: 'span', _key: 'a', text: 'x', marks: ['missing-link'] }] }] }]) {
    const out = transition({ ...fixture, ...patch });
    assert.equal(out.done, true); assert.equal(out.result.code, 'VALIDATION_ERROR'); assert.equal(out.request, undefined);
  }
});
test('default draft and native null image pass without image acquisition', () => {
  const p = { ...fixture }; delete p.publish_mode;
  assert.equal(transition(p).state.p.publish_mode, 'draft');
  const out = response(lookup(p), { total: 0, items: [] });
  assert.equal(out.request.method, 'POST'); assert.equal(out.request.body.status, 'draft');
  assert.equal(out.request.body.data.featured_image, null); assert.equal(out.request.body.bylines[0].bylineId, '01M3WACKKYR8PKDR9XAX91FF4W');
});
test('unknown category/location fail before content creation', () => {
  let out = response(transition({ ...fixture, category: 'invented' }), { terms: [term('plovdiv')] });
  assert.equal(out.result.code, 'VALIDATION_ERROR');
  out = transition({ ...fixture, locations: ['invented'] });
  out = response(out, { terms: [term('plovdiv')] });
  out = response(out, { terms: [term('tsentralen')] });
  assert.equal(out.result.code, 'VALIDATION_ERROR');
});
test('exact lookup never uses fuzzy search, and ambiguity refuses writes', () => {
  const out = lookup(); const url = new URL(out.request.url);
  assert.deepEqual(JSON.parse(url.searchParams.get('fieldFilters')), { story_key: fixture.story_key });
  assert.equal(url.searchParams.get('status'), 'all'); assert.equal(url.searchParams.has('q'), false);
  assert.equal(response(out, { total: 2, items: [item, item] }).result.code, 'DUPLICATE_STORY_KEY');
});
test('partial update retains slug, byline and omitted taxonomy/media fields, using _rev', () => {
  const p = { story_key: fixture.story_key, title: fixture.title, content: fixture.content };
  const out = update(p);
  assert.equal(out.request.method, 'PUT'); assert.equal(out.request.body._rev, 'rev-1');
  assert.deepEqual(Object.keys(out.request.body.data).sort(), ['content', 'story_key', 'title']);
  for (const key of ['status', 'slug', 'bylines', 'taxonomies', 'overrideLock', 'skipRevision']) assert.equal(key in out.request.body, false);
});
test('supplied taxonomies update atomically with content/revision; empty locations clears only locations', () => {
  const out = update({ ...fixture, locations: [] });
  assert.deepEqual(out.request.body.taxonomies, { category: ['plovdiv'], location: [] });
});
test('any editor lock including PAT owner terminates cleanly without override', () => {
  let out = response(lookup(), { total: 1, items: [item] });
  out = response(out, { item, _rev: 'rev-1' });
  out = response(out, { holder: { userId: 'owner' }, heldByCaller: true });
  assert.equal(out.result.code, 'ENTRY_LOCKED'); assert.equal(out.result.retryable, true); assert.equal(out.request, undefined);
  assert.equal(error(update(), 'ENTRY_LOCKED').result.code, 'ENTRY_LOCKED');
});
test('stale update retries once only when substantive state has not changed', () => {
  let out = error(update(), 'CONFLICT'); assert.equal(out.state.step, 'retryRead');
  out = response(out, { item, _rev: 'rev-2' }); out = response(out, { holder: null });
  assert.equal(out.request.body._rev, 'rev-2');
  out = error(out, 'CONFLICT'); assert.equal(out.done, true); assert.equal(out.result.code, 'CONFLICT');
});
test('stale update does not overwrite intervening human changes', () => {
  const out = response(error(update(), 'CONFLICT'), { item: { ...item, data: { ...item.data, title: 'human edit' } }, _rev: 'rev-2' });
  assert.equal(out.result.code, 'CONFLICT'); assert.equal(out.request, undefined);
});
test('publish reads final draft token and refuses a changed revision', () => {
  const p = { ...fixture, publish_mode: 'publish' };
  const saved = { ...item, data: { ...item.data, title: fixture.title, content: fixture.content } };
  let out = response(update(p), { item: saved, _rev: 'written' });
  assert.equal(out.state.step, 'ready');
  const conflict = response(out, { item: saved, _rev: 'another-writer' }); assert.equal(conflict.result.code, 'CONFLICT');
  out = response(out, { item: saved, _rev: 'written' }); out = response(out, { holder: null });
  assert.equal(out.state.step, 'publish'); assert.deepEqual(out.request.body, { _rev: 'written' });
  out = error(out, 'CONFLICT'); out = response(out, { item: saved, _rev: 'latest' }); out = response(out, { holder: null });
  assert.deepEqual(out.request.body, { _rev: 'latest' }); assert.equal(error(out, 'CONFLICT').result.code, 'CONFLICT');
});
test('unique race/Trash reservation refuses duplicates; transport errors are sanitized', () => {
  const out = response(lookup(), { total: 0, items: [] });
  for (const code of ['CONFLICT', 'CONTENT_CREATE_ERROR']) {
    const recovery = error(out, code, code === 'CONFLICT' ? 409 : 500);
    assert.equal(recovery.state.step, 'recoverLookup');
    assert.equal(response(recovery, { total: 1, items: [item] }).result.code, 'STORY_KEY_CONFLICT');
    assert.equal(response(recovery, { total: 0, items: [] }).result.code, code);
  }
  const result = transition({ state: out.state, response: { error: { message: 'untrusted transport detail' } } });
  assert.equal(result.result.code, 'TRANSPORT_ERROR'); assert.equal(JSON.stringify(result).includes('untrusted'), false);
});
