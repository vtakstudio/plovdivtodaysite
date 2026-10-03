import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sources,canonical,ingest,articleText,selection,payload,hash,localDate,contextCandidates} from './news-pipeline.mjs';
import {transition} from './publisher-machine.mjs';
const now='2026-10-03T00:00:00Z';
const a={candidate_id:'official',source_id:'plovdiv_municipality',source_role:'primary_official',url:'https://www.plovdiv.bg/closure/',title:'Официална промяна',excerpt:'Факти'};
const b={candidate_id:'discovery',source_id:'plovdiv24',source_role:'discovery',url:'https://www.plovdiv24.bg/novini/plovdiv/closure',title:'Същата промяна',excerpt:'Допълнение'};
const group={candidate_ids:[b.candidate_id,a.candidate_id],action:'new',existing_story_key:null,sensitive:false,reason:'Полезна промяна'};
test('latest equally authoritative context includes a resolved incident without changing identity',()=>{
 const initial={...a,published_at:'2026-10-03T06:20:00Z'};
 const resolved={...a,candidate_id:'resolved',url:a.url+'resolved',published_at:'2026-10-03T06:32:00Z'};
 const story=selection({stories:[{...group,candidate_ids:[initial.candidate_id,resolved.candidate_id,b.candidate_id]}]},[initial,resolved,b],[])[0];
 assert.equal(story.story_key,'news-'+hash(initial.url));
 assert.deepEqual(contextCandidates(story.candidates),[resolved,b]);
});
test('sandbox SHA-256 preserves Node IDs for UTF-8 and padding boundaries',()=>{
 for(const s of ['', 'abc', 'Пловдив 🚦', ...[55,56,63,64,65,1000].map(n=>'a'.repeat(n)),...sources.map(s=>s.url)])assert.equal(hash(s),createHash('sha256').update(s).digest('hex').slice(0,16));
});
test('URL tracking dedupe keeps identity query parameters',()=>{
 assert.equal(canonical('https://pd.government.bg/?utm_source=x&p=44250#comments'),'https://pd.government.bg/?p=44250');
 assert.throws(()=>canonical('javascript:alert(1)'));
});
test('sandbox URL handling preserves encoded paths, relative links and rejects unsafe URLs',()=>{
 for(const [url,base] of [
  ['https://EXAMPLE.com:443/a%2Fb?q=%D0%BF+test&b=1'],
  ['/новини/../новина?utm_source=x&p=4','https://example.com/feed/'],
  ['../news?a=two%20words','https://example.com/feed/index'],
  ['https://example.com/?z=~&a=1&a=2#fragment']
 ]) {
  const expected=new URL(url,base);expected.hash='';for(const k of [...expected.searchParams.keys()])if(k.startsWith('utm_'))expected.searchParams.delete(k);expected.searchParams.sort();
  assert.equal(canonical(url,base),expected.href);
 }
 for(const url of ['javascript:alert(1)','https://user:password@example.com/','https://example.com\\\\@evil.com/','https://example.com/bad path'])assert.throws(()=>canonical(url));
});
test('RSS rejects old/missing dates individually without dropping usable items',()=>{
 const rss='<rss><channel>'+['Fri, 02 Oct 2026 15:00:00 +0000','Wed, 30 Sep 2026 15:00:00 +0000',''].map((d,i)=>`<item><title>T${i}</title><link>https://www.plovdiv.bg/${i}/</link><description><![CDATA[<p>Факти &amp; подробности</p>]]></description><pubDate>${d}</pubDate></item>`).join('')+'</channel></rss>';
 const rows=ingest(sources[0],rss,now);assert.equal(rows.length,1);assert.equal(rows[0].excerpt,'Факти & подробности');
});
test('BTA adapter reads regional post list and excludes global menu cards',()=>{
 const card=(title,path)=>`<article class="news-card news-card--white"><div class="news-card__meta">02.10.2026 22:19</div><h3 class="news-card__title"><a href="${path}">${title}</a></h3></article>`;
 const html=card('София','/bg/news/bulgaria/1-other')+'<div class="post-list row">'+card('Пловдив','/bg/news/bulgaria/regional-news/oblast-plovdiv/2-local')+'</div>';
 const rows=ingest(sources[2],html,now);assert.equal(rows.length,1);assert.equal(rows[0].title,'Пловдив');assert.equal(rows[0].published_at,'2026-10-02T19:19:00.000Z');
});
test('Bulgarian source dates use Sofia summer and winter offsets',()=>{
 assert.equal(localDate('2 Октомври 2026'),'2026-10-01T21:00:00.000Z');
 assert.equal(localDate('02.12.2026 10:00'),'2026-12-02T08:00:00.000Z');
});
test('primary extraction isolates nested editorial content and refuses syndicated BTA',()=>{
 const facts='Конкретна проверена информация за движението в Пловдив. '.repeat(4);
 const html=`<nav>Меню</nav><div class="post-content"><div><p>${facts}</p></div><script>bad()</script></div><footer>Футър</footer>`;
 assert.equal(articleText(sources[0],html),facts.trim());
 assert.throws(()=>articleText(sources[2],`<div class="post__author">Reuters</div><div class="post__sources">БТА</div><div class="post__content"><p>${facts}</p></div>`),/BTA_NOT_ORIGINAL/);
 assert.throws(()=>articleText(sources[4],html),/DISCOVERY_FULL_TEXT_FORBIDDEN/);
});
test('duplicate grouping chooses official primary and derives key outside model',()=>{
 const stories=selection({stories:[group]},[a,b],[]);assert.equal(stories.length,1);assert.equal(stories[0].candidates[0].source_id,'plovdiv_municipality');assert.equal(stories[0].story_key,'news-'+hash(a.url));
 assert.throws(()=>selection({stories:[group,group]},[a,b],[]),/REPEATED_ID/);
 assert.throws(()=>selection({stories:[{...group,candidate_ids:['invented']}]},[a,b],[]),/UNKNOWN/);
});
test('updates reuse only known keys; unchanged unseen candidates can be skipped',()=>{
 assert.throws(()=>selection({stories:[{...group,action:'update',existing_story_key:'invented'}]},[a,b],[]),/UNKNOWN_UPDATE/);
 const stories=selection({stories:[{...group,action:'update',existing_story_key:'news-existing'}]},[a,b],[{story_key:'news-existing'}]);assert.equal(stories[0].story_key,'news-existing');
 assert.equal(selection({stories:[]},[a,b],[]).filter(s=>s.action==='skip').length,2);
});
test('hard story ceiling, refusals and Portable Text contract',()=>{
 const candidates=Array.from({length:12},(_,i)=>({...a,candidate_id:'c'+i,url:a.url+i}));
 const stories=selection({stories:candidates.map(c=>({...group,candidate_ids:[c.candidate_id]}))},candidates,[]);assert.equal(stories.filter(s=>s.action==='new').length,10);
 const story=selection({stories:[group]},[a,b],[])[0];const bundle=[{url:a.url,name:'Община Пловдив'}];
 const w={write:true,title:'Променят движението',excerpt:'Конкретна промяна в Пловдив.',category:'trafik',locations:['plovdiv'],blocks:[{type:'paragraph',text:'Първи абзац.'},{type:'heading',text:'Какво се променя'},{type:'bullet',text:'Първа промяна'}],source_name:'Община Пловдив',source_url:a.url,featured:false,breaking:false};
 const p=payload(w,story,bundle);assert.equal(p.publish_mode,'publish');assert.equal(p.featured_image,null);assert.equal(p.content[2].listItem,'bullet');assert.equal(transition(p).request.method,'GET');assert.deepEqual(payload(w,story,bundle),p);
 assert.equal(payload({write:false,reason:'Няма достатъчно факти'},story,bundle),null);
 assert.throws(()=>payload({...w,locations:['invented']},story,bundle),/TAXONOMY/);
 assert.throws(()=>payload({...w,source_url:'https://fake.example/'},story,bundle),/SOURCE/);
});
