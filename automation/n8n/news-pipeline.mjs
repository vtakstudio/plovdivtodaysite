// Shared deterministic adapters and validation, embedded in n8n Code nodes by the builder.
export const sources = [
  {source_id:'plovdiv_municipality',name:'Община Пловдив',source_role:'primary_official',method:'rss',url:'https://www.plovdiv.bg/feed/',bodyClass:'post-content'},
  {source_id:'odmvr_plovdiv',name:'ОДМВР-Пловдив',source_role:'primary_official',method:'mvr',url:'https://www.mvr.bg/plovdiv/'+encodeURI('информационен-център/пресцентър/новини'),bodyClass:'page-content'},
  {source_id:'bta_plovdiv',name:'БТА',source_role:'primary_editorial',method:'bta',url:'https://www.bta.bg/bg/news/bulgaria/regional-news/oblast-plovdiv',bodyClass:'post__content'},
  {source_id:'plovdiv_regional_admin',name:'Областна администрация Пловдив',source_role:'primary_official',method:'rss',url:'https://pd.government.bg/?feed=rss2&cat=3',bodyClass:'entry-content'},
  {source_id:'plovdiv24',name:'Plovdiv24',source_role:'discovery',method:'rss',url:'https://www.plovdiv24.bg/rss.php?cat=1'},
  {source_id:'plovdiv24',name:'Plovdiv24',source_role:'discovery',method:'rss',url:'https://www.plovdiv24.bg/rss.php?cat=2'},
  {source_id:'podtepeto',name:'Под тепето',source_role:'discovery',method:'rss',url:'https://podtepeto.com/feed/'}
];
export const categories=['plovdiv','trafik','oblast-plovdiv','kriminalni','biznes','kultura','sport','bulgaria','uikend'];
export const locations=['plovdiv','tsentralen','trakia','yuzhen','severen','zapaden','iztochen','oblast-plovdiv','asenovgrad','karlovo','hisarya','rakovski'];
// SHA-256 without module imports: n8n's task runner blocks node:crypto.
export function hash(s) {
  const bytes=Array.from(unescape(encodeURIComponent(s)),c=>c.charCodeAt(0));
  const length=bytes.length*8;
  bytes.push(128);while(bytes.length%64!==56)bytes.push(0);
  for(let i=7;i>=0;i--)bytes.push(i>=4?Math.floor(length/2**(i*8))&255:(length>>>i*8)&255);
  const k=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const rotate=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let offset=0;offset<bytes.length;offset+=64) {
    const w=[];
    for(let i=0;i<16;i++){const j=offset+i*4;w[i]=(bytes[j]<<24)|(bytes[j+1]<<16)|(bytes[j+2]<<8)|bytes[j+3];}
    for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=(w[i-16]+(rotate(x,7)^rotate(x,18)^(x>>>3))+w[i-7]+(rotate(y,17)^rotate(y,19)^(y>>>10)))|0;}
    let [a,b,c,d,e,f,g,z]=h;
    for(let i=0;i<64;i++) {
      const t1=(z+(rotate(e,6)^rotate(e,11)^rotate(e,25))+((e&f)^(~e&g))+k[i]+w[i])|0;
      const t2=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))|0;
      z=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
    }
    [a,b,c,d,e,f,g,z].forEach((v,i)=>h[i]=(h[i]+v)|0);
  }
  return h.slice(0,2).map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
}
export function decode(s='') {
  return String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&#(x[\da-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):Number(v);return n<=0x10ffff?String.fromCodePoint(n):'';}).replace(/&(amp|lt|gt|quot|apos|nbsp|ndash|mdash|hellip|rsquo|lsquo|rdquo|ldquo|bdquo);/g,(_,v)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',hellip:'…',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“',bdquo:'„'}[v]));
}
export function text(html='') {
  return decode(String(html).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<(script|style|nav|footer|aside|noscript|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<!--[^]*?-->/g,' ').replace(/<\/?[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
}
// Only HTTP(S) source URLs are accepted; no URL global is available in n8n Code.
export function urlParts(raw,base) {
  let value=decode(raw).trim();
  if(/[\\\s]/.test(value))throw Error('URL_MALFORMED');
  if(base&&!/^[a-z][a-z\d+.-]*:/i.test(value)) {
    const parent=urlParts(base);
    value=value.startsWith('//')?parent.protocol+value:parent.origin+(value.startsWith('/')?value:value.startsWith('?')?parent.pathname+value:parent.pathname.replace(/[^/]*$/,'')+value);
  }
  const m=value.match(/^(https?):\/\/([^/?#]+)([^?#]*)(?:\?([^#]*))?(?:#.*)?$/i);
  if(!m)throw Error('URL_SCHEME');
  if(m[2].includes('@'))throw Error('URL_AUTH');
  const authority=m[2].toLowerCase();
  if(!/^[a-z\d.-]+(?::\d{1,5})?$/.test(authority))throw Error('URL_HOST');
  const protocol=m[1].toLowerCase()+':';
  const host=authority.replace(protocol==='https:'?/:443$/:/:80$/,'');
  const segments=[];
  for(const segment of (m[3]||'/').split('/')) {
    const dot=segment.replace(/%2e/gi,'.');
    if(dot==='..')segments.pop();else if(dot!=='.')segments.push(segment);
  }
  let pathname=encodeURI(segments.join('/')||'/').replace(/%25([\da-f]{2})/gi,'%$1');
  if(/\/(?:\.|\.\.)$/.test(m[3])&&!pathname.endsWith('/'))pathname+='/';
  const origin=protocol+'//'+host;
  return {protocol,origin,hostname:host.split(':')[0],pathname,query:m[4]||''};
}
export function canonical(raw,base) {
  const u=urlParts(raw,base);
  const query=u.query?u.query.split('&').filter(Boolean).map(part=>{
    const i=part.indexOf('=');return [i<0?part:part.slice(0,i),i<0?'':part.slice(i+1)].map(v=>decodeURIComponent(v.replace(/\+/g,' ')));
  }).filter(([key])=>!/^utm_|^(fbclid|gclid|yclid|mc_cid|mc_eid)$/i.test(key)).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0):[];
  const encode=v=>encodeURIComponent(v).replace(/%20/g,'+').replace(/[!'()~]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
  return u.origin+u.pathname+(query.length?'?'+query.map(pair=>pair.map(encode).join('=')).join('&'):'');
}
// Return complete known class containers, respecting nested same-tag elements.
export function containers(html,cls) {
  const re=/<([a-z][\w:-]*)\b[^>]*\bclass\s*=\s*["']([^"']*)["'][^>]*>/gi;const out=[];let m;
  while((m=re.exec(html))) {
    if(!m[2].split(/\s+/).includes(cls))continue;
    const tags=new RegExp('<\\/?'+m[1]+'\\b[^>]*>','gi');tags.lastIndex=re.lastIndex;let depth=1,end;let t;
    while((t=tags.exec(html))){depth+=t[0][1]==='/'?-1: /\/>$/.test(t[0])?0:1;if(depth===0){end=tags.lastIndex;break;}}
    if(end){out.push(html.slice(m.index,end));re.lastIndex=end;}
  }return out;
}
export function localDate(value) {
  let v=text(value).toLowerCase();const months=['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];
  for(let i=0;i<months.length;i++)v=v.replace(months[i],'.'+String(i+1).padStart(2,'0')+'.');
  const m=v.match(/(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})(?:\s*(?:г\.)?\s*(\d{1,2}):(\d{2}))?/);
  if(!m)return null;
  const utc=Date.UTC(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0));
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Sofia',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(utc).map(p=>[p.type,p.value]));
  const offset=Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute)-utc;
  return new Date(utc-offset).toISOString();
}
const xml=(s,tag)=>decode(s.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'))?.[1]||'');
export function ingest(source,html,now=new Date().toISOString()) {
  let raw=[];
  if(source.method==='rss')raw=[...html.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m=>({title:text(xml(m[1],'title')),url:xml(m[1],'link'),excerpt:text(xml(m[1],'description')).replace(/Материалът .* е публикуван за пръв път.*$/,'').trim().slice(0,2200),published_at:Number.isFinite(Date.parse(xml(m[1],'pubDate')))?new Date(xml(m[1],'pubDate')).toISOString():null}));
  else for(const card of containers(source.method==='bta'?(containers(html,'post-list')[0]||''):html,source.method==='bta'?'news-card':'card')) {
    const cls=source.method==='bta'?'news-card__title':'card__title'; const titleNode=containers(card,cls)[0]||'';
    const a=titleNode.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const date=containers(card,source.method==='bta'?'news-card__meta':'card__meta')[0];
    if(a&&date)raw.push({title:text(a[2]),url:a[1],excerpt:text(containers(card,'news-card__text')[0]||''),published_at:localDate(date)});
  }
  const unique=new Map();
  for(const r of raw)try {
    const url=canonical(r.url,source.url);const host=urlParts(url).hostname;
    if(host!==urlParts(source.url).hostname||!r.title||!r.published_at)continue;
    if(source.method==='bta'&&!/\/bg\/news\/bulgaria\/(?:regional-news\/oblast-plovdiv\/)?\d+-/.test(urlParts(url).pathname))continue;
    const age=Date.parse(now)-Date.parse(r.published_at);
    if(!Number.isFinite(age)||age>36*3600000||age< -3600000)continue;
    unique.set(url,{candidate_id:hash(url),source_id:source.source_id,source_role:source.source_role,url,title:r.title,excerpt:r.excerpt,published_at:r.published_at,detected_at:now,status:'new',story_key:'',emdash_id:'',error:''});
  }catch{} return [...unique.values()];
}
export function primary(candidates) {
  const rank={primary_official:0,primary_editorial:1,discovery:2};
  return [...candidates].sort((a,b)=>rank[a.source_role]-rank[b.source_role]||a.url.localeCompare(b.url));
}
// Identity stays tied to primary(); writing uses the newest equally authoritative report.
export function contextCandidates(candidates) {
  const sorted=primary(candidates);
  const main=sorted.filter(c=>c.source_role===sorted[0].source_role).sort((a,b)=>b.published_at.localeCompare(a.published_at)||a.url.localeCompare(b.url))[0];
  return [main,...sorted.filter(c=>c.candidate_id!==main.candidate_id&&c.source_role==='discovery')].slice(0,3);
}
export function articleText(source,html) {
  if(source.source_role==='discovery')throw Error('DISCOVERY_FULL_TEXT_FORBIDDEN');
  if(source.source_id==='bta_plovdiv') {
    const author=text(containers(html,'post__author')[0]||'');const attribution=text(containers(html,'post__sources')[0]||'');
    if(!/БТА/.test(author)||!/^\(?БТА\)?$/.test(attribution)||/Reuters|Ройтерс|Асошиейтед прес|Франс прес|\b(?:AP|AFP)\b/i.test(author+' '+attribution))throw Error('BTA_NOT_ORIGINAL');
  }
  const body=containers(html,source.bodyClass)[0];if(!body)throw Error('SOURCE_BODY_MISSING');
  const cleanBody=body.replace(/<(script|style|nav|aside|footer|noscript|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
  const paragraphs=[...cleanBody.matchAll(/<(p|li|h[2-4])\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m=>text(m[2])).filter(s=>s&&!/total views|views today/i.test(s));
  const result=paragraphs.join('\n\n').trim();if(result.length<120)throw Error('SOURCE_BODY_TOO_SHORT');return result.slice(0,6500);
}
export function selection(output,candidates,recent) {
  if(!output||!Array.isArray(output.stories))throw Error('SELECTOR_SCHEMA');
  const map=new Map(candidates.map(c=>[c.candidate_id,c]));const used=new Set(),keys=new Set();let count=0;const result=[];
  for(const s of output.stories) {
    if(!Array.isArray(s.candidate_ids)||!s.candidate_ids.length||!['new','update','skip'].includes(s.action)||typeof s.sensitive!=='boolean'||typeof s.reason!=='string')throw Error('SELECTOR_SCHEMA');
    const members=s.candidate_ids.map(id=>{if(!map.has(id)||used.has(id))throw Error('SELECTOR_UNKNOWN_OR_REPEATED_ID');used.add(id);return map.get(id);});
    let story_key=null;let action=s.action;let reason=s.reason;
    if(action==='update'){if(!recent.some(r=>r.story_key===s.existing_story_key))throw Error('SELECTOR_UNKNOWN_UPDATE');story_key=s.existing_story_key;}
    if(action==='new'){if(s.existing_story_key!==null)throw Error('SELECTOR_NEW_KEY');story_key='news-'+hash(primary(members)[0].url);}
    if(action!=='skip'){if(keys.has(story_key))throw Error('SELECTOR_REPEATED_STORY');keys.add(story_key);if(++count>10){action='skip';reason='Execution limit: maximum 10 stories';}}
    result.push({...s,action,reason,story_key,candidates:primary(members)});
  }
  for(const c of candidates)if(!used.has(c.candidate_id))result.push({candidate_ids:[c.candidate_id],candidates:[c],action:'skip',reason:'Not selected',story_key:null,sensitive:false});
  return result;
}
export function payload(writer,story,bundle) {
  if(!writer||typeof writer.write!=='boolean')throw Error('WRITER_SCHEMA');
  if(!writer.write){if(typeof writer.reason!=='string'||!writer.reason.trim())throw Error('WRITER_REFUSAL_REASON');return null;}
  if(!categories.includes(writer.category)||!Array.isArray(writer.locations)||writer.locations.some(x=>!locations.includes(x))||new Set(writer.locations).size!==writer.locations.length)throw Error('WRITER_TAXONOMY');
  if(typeof writer.title!=='string'||!writer.title.trim()||writer.title.length>250||typeof writer.excerpt!=='string'||!writer.excerpt.trim()||writer.excerpt.length>700)throw Error('WRITER_TEXT');
  if(!Array.isArray(writer.blocks)||!writer.blocks.length||writer.blocks.length>60||writer.blocks.some(b=>!['paragraph','heading','bullet'].includes(b.type)||typeof b.text!=='string'||!b.text.trim()||/[<>]/.test(b.text)))throw Error('WRITER_BLOCKS');
  const src=bundle.find(c=>c.url===writer.source_url);if(!src||writer.source_name!==src.name)throw Error('WRITER_SOURCE');
  if(typeof writer.featured!=='boolean'||typeof writer.breaking!=='boolean')throw Error('WRITER_FLAGS');
  const content=writer.blocks.map((b,i)=>({_type:'block',_key:'b'+i,style:b.type==='heading'?'h2':'normal',markDefs:[],children:[{_type:'span',_key:'s'+i,text:b.text.trim(),marks:[]}],...(b.type==='bullet'?{listItem:'bullet',level:1}:{})}));
  return {story_key:story.story_key,title:writer.title.trim(),excerpt:writer.excerpt.trim(),content,category:writer.category,locations:writer.locations,source_name:src.name,source_url:src.url,featured:writer.featured,breaking:writer.breaking,featured_image:null,publish_mode:'publish'};
}
