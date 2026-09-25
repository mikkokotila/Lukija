import {createHash} from 'node:crypto';
export const names=['Yuzuan-Zhouyi-Zhezhong','Sanming-Tongshui'];
export function blobSHA(text) {
  const data=Buffer.from(text); return createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
}
export async function mockCatalog(page) {
  const state={files:{},status:{},requests:[],rawOverride:null,listingWait:null};
  for (const [index,name] of names.entries()) {
    state.files[name]={};
    for (let n=1;n<=(index===0?4:2);n++) {
      const number=String(n).padStart(2,'0');
      state.files[name][`translation/juan-${number}.md`]=`# ${index===0?'Zhouyi':'Sanming'} — Juan ${number}\n\nSynthetic catalogue fixture, not a translation.\n\n## The opening\n\nOriginal fixture revision ${number}.\n\nLie Yukou says: “What has form is born from what has no form.”[^note]\n\n[^note]: A fixture endnote.`;
    }
    state.files[name]['translation/README.md']='# Translation conventions';
    state.files[name]['source/juan-03.md']='# Untranslated source';
  }
  await page.route(/^https:\/\/api\.github\.com\/repos\/mikkokotila\/(Yuzuan-Zhouyi-Zhezhong|Sanming-Tongshui)\//,async route=>{
    const url=new URL(route.request().url()), name=url.pathname.split('/')[3]; state.requests.push(url.href);
    if (state.listingWait) await state.listingWait;
    const error=state.status[name];
    if (error) return route.fulfill({status:error,contentType:'application/json',headers:error===429?{'retry-after':'60'}:{},body:'{"message":"Test source error"}'});
    if (url.pathname.includes('/contents/translation')) {
      const files=Object.entries(state.files[name]).filter(([path])=>path.startsWith('translation/')).map(([path,text])=>({type:'file',path,name:path.split('/').pop(),sha:blobSHA(text),size:Buffer.byteLength(text)}));
      return route.fulfill({contentType:'application/json',body:JSON.stringify(files)});
    }
    const sha=url.pathname.split('/').pop();
    const text=Object.values(state.files[name]).find(t=>blobSHA(t)===sha);
    return route.fulfill({status:text?200:404,contentType:'text/plain',body:text || 'Missing blob'});
  });
  await page.route(/^https:\/\/raw\.githubusercontent\.com\/mikkokotila\/(Yuzuan-Zhouyi-Zhezhong|Sanming-Tongshui)\//,async route=>{
    const url=new URL(route.request().url()), parts=url.pathname.split('/'), name=parts[2], path=parts.slice(4).join('/');
    state.requests.push(url.href); const text=state.rawOverride ?? state.files[name]?.[path];
    return route.fulfill({status:text?200:404,contentType:'text/plain',body:text || 'Missing file'});
  });
  return state;
}
