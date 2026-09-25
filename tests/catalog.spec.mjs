import {test,expect} from '@playwright/test';
import {mockCatalog,blobSHA,names} from './catalog-fixture.mjs';
let fixture;
test.beforeEach(async({page})=>{fixture=await mockCatalog(page); await page.goto('/');});
async function choose(page,id='zhouyi-zhezhong',number='01') {
  await page.keyboard.press('l'); await page.locator(`#library-list [data-work="${id}"]`).click();
  await expect(page.locator('#work-status')).toContainText('juan available');
  await page.locator(`#work-volume-list [data-path="translation/juan-${number}.md"]`).click();
  await expect(page.locator('#manuscript')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/loading/);
}
async function check(page) {await page.evaluate(()=>window.dispatchEvent(new Event('online'))); await expect(page.locator('#refresh-catalog')).toBeEnabled();}
test('two books are discovered automatically and only translated juan are listed',async({page})=>{
  await expect(page.locator('[data-work="zhouyi-zhezhong"] .work-card-status')).toHaveText('4 juan available');
  await expect(page.locator('[data-work="sanming-tonghui"] .work-card-status')).toHaveText('2 juan available');
  await expect(page.locator('#published-work-list button')).toHaveCount(2);
  expect(fixture.requests.some(url=>url.includes('raw.githubusercontent'))).toBe(false);
  await page.locator('#published-work-list [data-work="zhouyi-zhezhong"]').click();
  await expect(page.locator('#work-volume-list button')).toHaveCount(4);
  await expect(page.locator('#work-volume-list')).not.toContainText('README');
});
test('identical filenames across books retain independent identities and URLs',async({page})=>{
  await choose(page); await expect(page.locator('#edition-han')).toHaveText('御纂周易折中');
  await expect(page).toHaveURL(/work=zhouyi-zhezhong/);
  await choose(page,'sanming-tonghui'); await expect(page.locator('#edition-han')).toHaveText('三命通會');
  await expect(page.locator('#manuscript')).toContainText('Original fixture revision');
  await expect(page).toHaveURL(/work=sanming-tonghui/);
});
test('a changed translation is checked and fetched on its next opening',async({page})=>{
  await choose(page); const path='translation/juan-01.md';
  fixture.files[names[0]][path]+='\n\nA freshly published correction.';
  await choose(page);
  await expect(page.locator('#manuscript')).toContainText('A freshly published correction.');
  await expect(page.locator('#source-status')).toContainText(blobSHA(fixture.files[names[0]][path]).slice(0,7));
});
test('new volumes appear and removed volumes disappear without a deployment',async({page})=>{
  await expect(page.locator('#refresh-catalog')).toBeEnabled();
  fixture.files[names[0]]['translation/juan-05.md']='# New translated volume\n\nFixture.';
  delete fixture.files[names[1]]['translation/juan-02.md'];
  await page.click('#refresh-catalog');
  await expect(page.locator('[data-work="zhouyi-zhezhong"] .work-card-status')).toHaveText('5 juan available');
  await expect(page.locator('[data-work="sanming-tonghui"] .work-card-status')).toHaveText('1 juan available');
  await choose(page,'zhouyi-zhezhong','05'); await expect(page.locator('#title-content h1')).toHaveText('New translated volume');
});
test('stale CDN content falls back to the exact listed Git blob',async({page})=>{
  fixture.rawOverride='# Wrong cached text\n\nNot the listed revision.';
  await choose(page); await expect(page.locator('#manuscript')).not.toContainText('Wrong cached text');
  expect(fixture.requests.some(url=>url.includes('/git/blobs/'))).toBe(true);
  await expect(page.locator('#title-content h1')).toContainText('Zhouyi');
});
test('open passages are not silently replaced when a new revision is found',async({page})=>{
  await choose(page); fixture.files[names[0]]['translation/juan-01.md']+='\n\nA new revision for testing.';
  await check(page); await expect(page.locator('#revision-notice')).toBeVisible();
  await expect(page.locator('#manuscript')).not.toContainText('A new revision for testing.');
  await page.click('#revision-load'); await expect(page.locator('#manuscript')).toContainText('A new revision for testing.');
  await expect(page.locator('#revision-notice')).toBeHidden();
});
test('one unavailable repository does not hide the other work or local import',async({page})=>{
  await expect(page.locator('#refresh-catalog')).toBeEnabled(); fixture.status[names[0]]=404; await check(page);
  await expect(page.locator('[data-work="zhouyi-zhezhong"] .work-card-status')).toContainText('unavailable');
  await expect(page.locator('[data-work="sanming-tonghui"] .work-card-status')).toHaveText('2 juan available');
  await choose(page,'sanming-tonghui'); await expect(page.locator('#title-content h1')).toContainText('Sanming');
});
test('rate limits are disclosed and do not replace the open manuscript',async({page})=>{
  await choose(page); fixture.status[names[0]]=429; await check(page);
  await expect(page.locator('#revision-notice')).toContainText('limiting requests');
  await expect(page.locator('#title-content h1')).toContainText('Zhouyi');
  const before=fixture.requests.length; await check(page);
  expect(fixture.requests.length).toBe(before);
});
test('book and volume deep links reopen after reload and preserve work branding',async({page})=>{
  await page.goto('/?work=sanming-tonghui&file=translation%2Fjuan-02.md');
  await expect(page.locator('#title-content h1')).toContainText('Sanming — Juan 02');
  await page.reload(); await expect(page.locator('#edition-han')).toHaveText('三命通會');
  await expect(page.locator('#title-content h1')).toContainText('Sanming — Juan 02');
  await page.goBack(); await expect(page.locator('#welcome')).toBeVisible();
});
test('public repository links to configured translations use the live collection',async({page})=>{
  await page.keyboard.press('l'); await page.fill('#url-input','https://github.com/mikkokotila/Sanming-Tongshui/blob/main/translation/juan-02.md');
  await page.click('#url-submit'); await expect(page.locator('#edition-han')).toHaveText('三命通會');
  await expect(page).toHaveURL(/work=sanming-tonghui/);
});
test('unknown work or traversal deep links do not fetch arbitrary private paths',async({page})=>{
  await page.goto('/?work=unknown&file=translation%2Fjuan-01.md'); await expect(page.locator('#load-message')).toContainText('not in the published collection');
  await page.goto('/?work=sanming-tonghui&file=translation%2F..%2Fsecret.md'); await expect(page.locator('#load-message')).toContainText('published translation volume');
  expect(fixture.requests.some(url=>url.includes('secret.md'))).toBe(false);
});
test('returning to a visible tab discovers volumes after the five-minute interval',async({page})=>{
  await expect(page.locator('[data-work="zhouyi-zhezhong"] .work-card-status')).toHaveText('4 juan available');
  fixture.files[names[0]]['translation/juan-05.md']='# Next volume\n\nFixture.';
  await page.evaluate(()=>{const now=Date.now; Date.now=()=>now()+300001; window.dispatchEvent(new Event('focus'));});
  await expect(page.locator('[data-work="zhouyi-zhezhong"] .work-card-status')).toHaveText('5 juan available');
});
test('next-juan navigation stays in the same book',async({page})=>{
  await choose(page); await page.click('#next-juan');
  await expect(page.locator('#title-content h1')).toContainText('Zhouyi — Juan 02');
  await expect(page).toHaveURL(/work=zhouyi-zhezhong/);
  await expect(page.locator('#edition-han')).toHaveText('御纂周易折中');
});
test('published text and relative image URLs are unchanged',async({page})=>{
  const path='translation/juan-01.md';
  fixture.files[names[0]][path]+='\n\n![Hexagram](../assets/figure.png)\n\n天地之理。';
  await choose(page);
  await expect(page.locator('#manuscript img')).toHaveAttribute('src','https://raw.githubusercontent.com/mikkokotila/Yuzuan-Zhouyi-Zhezhong/main/assets/figure.png');
  await page.keyboard.press('l'); await page.keyboard.press('Escape');
  if (await page.locator('#mobile-menu').isVisible()) await page.click('#mobile-menu');
  await page.click('#source-button'); await expect(page.locator('#source-textarea')).toHaveValue(fixture.files[names[0]][path]);
  const stored=await page.evaluate(()=>Object.values(localStorage).join(''));
  expect(stored).not.toContain('Synthetic catalogue fixture');
});
test('EPUB defaults distinguish volumes of the same work',async({page})=>{
  await choose(page,'zhouyi-zhezhong','02');
  if (await page.locator('#mobile-menu').isVisible()) await page.click('#mobile-menu');
  await page.click('#source-button'); await page.click('#export-epub');
  await expect(page.locator('#epub-book-title')).toHaveValue('Yuzuan Zhouyi Zhezhong · Juan 02');
});
test('offline reading copies retain book identity without connecting to GitHub',async({page},info)=>{
  await choose(page);
  if (await page.locator('#mobile-menu').isVisible()) await page.click('#mobile-menu');
  await page.click('#source-button'); const pending=page.waitForEvent('download'); await page.click('#export-reader');
  const path=info.outputPath('catalogue-reading-copy.html'); await (await pending).saveAs(path);
  const {readFile}=await import('node:fs/promises'); const html=await readFile(path,'utf8');
  const before=fixture.requests.length; await page.goto('about:blank'); await page.setContent(html);
  await expect(page.locator('#edition-han')).toHaveText('御纂周易折中');
  await expect(page.locator('#title-content')).toContainText('Yuzuan Zhouyi Zhezhong');
  expect(fixture.requests.length).toBe(before);
});
