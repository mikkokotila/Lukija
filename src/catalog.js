/* Public, live source catalog. No credentials, manuscript storage, or build-time snapshots. */
(() => {
'use strict';
const WORKS = Object.freeze([
  {id:'zhouyi-zhezhong', owner:'mikkokotila', repository:'Yuzuan-Zhouyi-Zhezhong', branch:'main', directory:'translation', title:'Yuzuan Zhouyi Zhezhong', chineseTitle:'御纂周易折中', description:'Imperially Compiled Balanced Interpretations of the Zhou Changes'},
  {id:'sanming-tonghui', owner:'mikkokotila', repository:'Sanming-Tongshui', branch:'main', directory:'translation', title:'Sanming Tonghui', chineseTitle:'三命通會', description:'A Comprehensive Gathering of the Three Fates'}
].map(Object.freeze));
const INTERVAL = 5 * 60 * 1000, LIMIT = 4 * 1024 * 1024;
const validName = name => /^(?:juan-\d{1,3}|front-matter|preface)\.(?:md|markdown)$/i.test(name);
const api = work => `https://api.github.com/repos/${work.owner}/${work.repository}`;
const raw = work => `https://raw.githubusercontent.com/${work.owner}/${work.repository}/${work.branch}/`;
const page = work => `https://github.com/${work.owner}/${work.repository}/blob/${work.branch}/`;
function create(onChange = () => {}) {
  const works = WORKS.map(work => ({...work, volumes:[], checkedAt:0, attemptedAt:0, error:'', etag:'', pending:null}));
  let retryAt = 0;
  const get = id => { const work=works.find(w => w.id===id); if (!work) throw new Error('This work is not in the published collection.'); return work; };
  function pathFor(work, path) {
    if (typeof path !== 'string' || !path.startsWith(work.directory+'/') || !validName(path.slice(work.directory.length+1))) throw new Error('Choose a published translation volume.');
    return path;
  }
  function descriptor(id, path) {
    const work=get(id); pathFor(work,path); const file=work.volumes.find(f => f.path===path);
    const match=/juan-(\d+)/i.exec(path), number=match ? Number(match[1]) : null;
    return {id:`catalog:${id}:${path}`,kind:'catalog',catalogId:id,path,number,verified:true,
      title:number!==null ? `Juan ${String(number).padStart(2,'0')}` : 'Front matter',workTitle:work.title,chineseTitle:work.chineseTitle,
      sourceURL:raw(work)+path,githubURL:page(work)+path,revision:file?.sha || '',sourceBytes:file?.size || 0,checkedAt:work.checkedAt};
  }
  async function request(url, {headers={}, signal, limit=LIMIT}={}) {
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),15000);
    const cancel=()=>controller.abort(); signal?.addEventListener('abort',cancel,{once:true});
    if (signal?.aborted) controller.abort();
    try {
      const response=await fetch(url,{headers,signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-cache'});
      if (response.status===304) return {response,bytes:null};
      if (!response.ok) {
        if ([403,429].includes(response.status) && new URL(url).hostname==='api.github.com') {
          const retry=response.headers.get('retry-after'), reset=Number(response.headers.get('x-ratelimit-reset'))*1000;
          retryAt=Math.max(Date.now()+60000, retry ? Date.now()+Number(retry)*1000 : reset || Date.now()+300000);
          if (!Number.isFinite(retryAt)) retryAt=Date.now()+300000;
          throw new Error('GitHub is limiting requests. Checks will resume after '+new Date(retryAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})+'.');
        }
        throw new Error(response.status===404 ? 'The public translation is unavailable or has been removed.' : `The source returned HTTP ${response.status}.`);
      }
      if (Number(response.headers.get('content-length'))>limit) throw new Error('The source exceeds the reader’s size limit.');
      const reader=response.body.getReader(), chunks=[]; let size=0;
      while (true) {
        const {done,value}=await reader.read(); if (done) break;
        size+=value.byteLength; if (size>limit) {await reader.cancel(); throw new Error('The source exceeds the reader’s size limit.');} chunks.push(value);
      }
      const bytes=new Uint8Array(size); let offset=0; for (const chunk of chunks) {bytes.set(chunk,offset); offset+=chunk.length;}
      return {response,bytes};
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Cancelled','AbortError');
      if (controller.signal.aborted) throw new Error('The source request timed out. Please try again.');
      throw error;
    } finally {clearTimeout(timer); signal?.removeEventListener('abort',cancel);}
  }
  async function refresh(id, {force=false}={}) {
    const work=get(id);
    if (work.pending) return work.pending;
    if (!force && Date.now()-work.attemptedAt<INTERVAL) return !work.error && !!work.checkedAt;
    work.pending=(async()=>{
      work.attemptedAt=Date.now(); work.error='';
      try {
        if (Date.now()<retryAt) throw new Error('GitHub request limit reached. Automatic checks will resume shortly.');
        const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10'};
        if (work.etag) headers['If-None-Match']=work.etag;
        const {response,bytes}=await request(api(work)+`/contents/${work.directory}?ref=${work.branch}`,{headers,limit:1024*1024});
        if (response.status!==304) {
          const listing=JSON.parse(new TextDecoder().decode(bytes));
          if (!Array.isArray(listing) || listing.length>=1000) throw new Error('The translation listing is incomplete or invalid.');
          const files=listing.filter(f=>f.type==='file' && validName(f.name) && f.path===work.directory+'/'+f.name);
          if (files.some(f=>!/^\w{40}$/.test(f.sha) || !/^[a-f0-9]{40}$/.test(f.sha) || !Number.isSafeInteger(f.size) || f.size<0)) throw new Error('The source listing has invalid revision information.');
          work.volumes=files.map(f=>({path:f.path,name:f.name,sha:f.sha,size:f.size})).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
          work.etag=response.headers.get('etag') || '';
        }
        work.checkedAt=Date.now(); return true;
      } catch(error) {work.error=error instanceof TypeError ? 'GitHub could not be reached. Check your connection and try again.' : error.message; return false;}
    })();
    onChange();
    try {return await work.pending;} finally {work.pending=null; onChange();}
  }
  async function refreshAll(options) { for (const work of works) await refresh(work.id,options); }
  async function matches(bytes, sha) {
    if (!globalThis.crypto?.subtle) return false;
    const header=new TextEncoder().encode(`blob ${bytes.length}\0`), blob=new Uint8Array(header.length+bytes.length);
    blob.set(header); blob.set(bytes,header.length);
    const digest=await crypto.subtle.digest('SHA-1',blob);
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')===sha;
  }
  async function read(id,path,signal) {
    const work=get(id); pathFor(work,path);
    if (!await refresh(id,{force:true})) throw new Error(work.error || 'The latest translation could not be verified.');
    if (signal?.aborted) throw new DOMException('Cancelled','AbortError');
    const file=work.volumes.find(f=>f.path===path);
    if (!file) throw new Error('This volume is no longer in the published translation directory.');
    if (file.size>LIMIT) throw new Error('This volume exceeds the 4 MB manuscript limit.');
    const entry=descriptor(id,path); let bytes;
    try {
      ({bytes}=await request(raw(work)+path+'?revision='+file.sha,{signal}));
      if (!await matches(bytes,file.sha)) bytes=null;
    } catch(error) {if (signal?.aborted) throw error; bytes=null;}
    if (!bytes) {
      if (Date.now()<retryAt) throw new Error('The latest file could not be verified while GitHub is limiting requests. Your open text is unchanged.');
      ({bytes}=await request(api(work)+'/git/blobs/'+file.sha,{signal,headers:{Accept:'application/vnd.github.raw+json'}}));
      if (globalThis.crypto?.subtle && !await matches(bytes,file.sha)) throw new Error('The translation failed its revision check. Please try again.');
    }
    if (bytes.length!==file.size) throw new Error('The source size does not match the published revision.');
    return {text:new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes),sourceURL:entry.sourceURL,descriptor:entry};
  }
  function identify(input) {
    let url; try {url=new URL(input);} catch (_) {return null;}
    if (url.username || url.password || url.protocol!=='https:') return null;
    for (const work of works) {
      const prefix=url.hostname==='raw.githubusercontent.com' ? raw(work) : url.hostname==='github.com' ? page(work) : '';
      if (!prefix || !url.href.startsWith(prefix)) continue;
      let path; try {path=decodeURIComponent(url.pathname.slice(new URL(prefix).pathname.length));} catch (_) {return null;}
      try {const entry=descriptor(work.id,path); entry.section=url.hash; return entry;} catch (_) {return null;}
    }
    return null;
  }
  return {works,get,descriptor,refresh,refreshAll,read,identify,interval:INTERVAL};
}
window.LukijaCatalog=Object.freeze({create,works:WORKS});
})();
