import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { checkedRelease } from '../../manifest.mjs';

const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../../app.js', import.meta.url), 'utf8');
const source = app.replace(/^import[^\n]+\n/, '');
const published = JSON.parse(await readFile(new URL('../../update.json', import.meta.url), 'utf8'));
const page = 'https://ciweilanqiu.github.io/jishang-course-table-downloads/';
const releaseUrl = (versionName = '1.2.1', versionCode = 5) =>
  `https://github.com/ciweilanqiu/jishang-course-table-downloads/releases/download/v${versionName}-code${versionCode}/CourseTable-v${versionName}-code${versionCode}-release.apk`;
const release = () => ({ applicationId: 'com.coursetable.app', channel: 'release', versionCode: 5,
  versionName: '1.2.1', minSdk: 29, fileSize: 9079168, sha256: 'a'.repeat(64),
  releaseNotes: '测试清单，不可发布\n<script>must remain text</script>',
  downloadUrl: releaseUrl() });

async function render({manifest = release(), ok = true, text, reject = false} = {}) {
  const elements = Object.fromEntries(['status','version','notes','details','download'].map(id => [id,
    { textContent: '', hidden: ['details','download'].includes(id), href: '' }]));
  const timers = [], navigations = [], requests = [];
  elements.download.click = () => navigations.push(elements.download.href);
  const context = {
    checkedRelease, AbortController, TextEncoder, JSON,
    document: { getElementById: id => elements[id] || null },
    window: { location: { origin: new URL(page).origin, assign: url => navigations.push(url) } },
    sessionStorage: { getItem() { throw Error('storage must not be used'); }, setItem() { throw Error('storage must not be used'); } },
    setTimeout: (fn, delay) => { timers.push({ fn, delay }); return timers.length; }, clearTimeout() {},
    fetch: async (url, options) => { requests.push({ url, options }); if (reject) throw Error('network error'); return { ok, text: async () => text ?? JSON.stringify(manifest) }; }
  };
  await vm.runInNewContext(source, context);
  return { elements, timers, navigations, requests };
}

test('备用页保留紫云样式、群号和唯一动态节点，不显示校验值或自动跳转', () => {
  for (const id of ['status','version','notes','details','download']) assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1);
  assert.match(html, /轻轻放进口袋/);
  assert.match(html, /GitHub 备用下载/);
  assert.match(html, /549013926/);
  assert.match(html, /非学校官方应用/);
  assert.match(html, /<a[^>]*id="download"[^>]*hidden/);
  assert.match(html, /\[hidden\]\s*\{\s*display\s*:\s*none\s*!important/);
  assert.match(html, /href="https:\/\/kechengbiao-68f\.pages\.dev\/"/);
  assert.match(html, /打开或刷新本页不会自动下载/);
  assert.doesNotMatch(html, /sha[-_]?256|http-equiv="refresh"|data-download|preview-note/i);
  assert.doesNotMatch(app, /location\s*[.=]|sessionStorage|\.click\s*\(|auto-download|innerHTML/);
});

test('页面脚本、模块和清单均使用相对路径，适配项目子目录且无需 Cloudflare 资源', async () => {
  assert.match(html, /type="module" src="\.\/app\.js"/);
  assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => m[1]), ['./app.js']);
  assert.match(app, /from "\.\/manifest\.mjs"/);
  const r = await render();
  assert.equal(r.requests[0].url, './update.json');
  assert.equal(new URL(r.requests[0].url, page).href, page + 'update.json');
  assert.equal(new URL('./manifest.mjs', new URL('./app.js', page)).href, page + 'manifest.mjs');
  assert.doesNotMatch(app, /cloudflare|pages\.dev|fetch\("\//i);
});

test('有效清单展示版本、大小、平台及精确 Release 链接，更新说明按文本写入', async () => {
  const {elements, requests, timers, navigations} = await render();
  assert.equal(elements.download.href, releaseUrl());
  assert.equal(elements.download.hidden, false);
  assert.equal(elements.details.hidden, false);
  assert.equal(elements.version.textContent, '版本 1.2.1 · 8.7 MB · Android 10 及以上');
  assert.equal(elements.notes.textContent, release().releaseNotes);
  assert.equal(requests[0].options.cache, 'no-store');
  assert.match(elements.status.textContent, /点击上方下载按钮.*不会自动下载/);
  assert.deepEqual(timers.map(t => t.delay), [8000]);
  assert.deepEqual(navigations, []);
  elements.download.click();
  assert.deepEqual(navigations, [releaseUrl()]);
});

test('首次访问、重复访问及新版都只请求清单，不自动请求 APK 或跳转', async () => {
  const newer = {...release(), versionName: '1.2.2', versionCode: 6, downloadUrl: releaseUrl('1.2.2', 6)};
  for (const manifest of [release(), release(), newer]) {
    const r = await render({manifest});
    for (const timer of r.timers) timer.fn();
    assert.deepEqual(r.navigations, []);
    assert.deepEqual(r.requests.map(r => r.url), ['./update.json']);
    assert.equal(r.elements.download.href, manifest.downloadUrl);
    assert.equal(r.elements.download.hidden, false);
  }
});

test('只接受对应版本、仓库和资产名的 HTTPS 正式 Release 地址', async () => {
  const invalidUrls = [
    releaseUrl().replace('https:', 'http:'),
    releaseUrl().replace('github.com', 'untrusted.example'),
    releaseUrl().replace('github.com', 'github.com.evil.example'),
    releaseUrl().replace('github.com/', 'github.com:443/'),
    releaseUrl().replace('github.com', 'user:password@github.com'),
    releaseUrl().replace('/ciweilanqiu/', '/another-user/'),
    releaseUrl().replace('/jishang-course-table-downloads/', '/another-repository/'),
    releaseUrl().replace('/v1.2.1-code5/', '/v1.2.1-code4/'),
    releaseUrl().replace('/v1.2.1-code5/', '/latest/'),
    releaseUrl().replace('code5-release.apk', 'code4-release.apk'),
    releaseUrl().replace('-release.apk', '-debug.apk'),
    releaseUrl().replace('-release.apk', '.apk'),
    releaseUrl() + '?download=1',
    releaseUrl() + '#download',
    releaseUrl().replace('/releases/', '/placeholder/../releases/')
  ];
  for (const downloadUrl of invalidUrls) {
    const manifest = {...release(), downloadUrl};
    assert.throws(() => checkedRelease(manifest), Error, downloadUrl);
    const r = await render({manifest});
    assert.equal(r.elements.download.hidden, true, downloadUrl);
    assert.equal(r.elements.download.href, '', downloadUrl);
    assert.deepEqual(r.navigations, []);
  }
});

test('清单字段类型、正式渠道、版本、文件大小及校验值不合法时拒绝下载', async () => {
  const invalid = [null, [], {...release(), applicationId: 'other.app'},
    {...release(), channel: 'debug'}, {...release(), channel: 'RELEASE'},
    {...release(), versionCode: '5'}, {...release(), versionCode: 0},
    {...release(), versionName: '1.2.1/other'}, {...release(), versionName: ' 1.2.1'},
    {...release(), minSdk: '29'}, {...release(), minSdk: 0},
    {...release(), fileSize: '9079168'}, {...release(), fileSize: 0},
    {...release(), sha256: 'invalid'}, {...release(), releaseNotes: ''},
    {...release(), releaseNotes: 'x'.repeat(4001)}, {...release(), downloadUrl: 123}];
  for (const manifest of invalid) {
    assert.throws(() => checkedRelease(manifest), Error);
    const r = await render({manifest});
    assert.equal(r.elements.download.hidden, true);
    assert.equal(r.elements.details.hidden, true);
    assert.match(r.elements.status.textContent, /暂不可用/);
    assert.deepEqual(r.navigations, []);
  }
});

test('缺失清单、网络失败、JSON 错误或超大响应均失败关闭，不请求 APK', async () => {
  for (const options of [{ok: false}, {reject: true}, {text: 'not-json'}, {text: 'x'.repeat(65537)}]) {
    const r = await render(options);
    for (const timer of r.timers) timer.fn();
    assert.equal(r.elements.download.hidden, true);
    assert.equal(r.elements.details.hidden, true);
    assert.equal(r.elements.download.href, '');
    assert.match(r.elements.status.textContent, /暂不可用.*主站入口/);
    assert.deepEqual(r.navigations, []);
    assert.deepEqual(r.requests.map(r => r.url), ['./update.json']);
  }
});

test('根清单指向已知 code5 资产且保留正式包元数据', () => {
  assert.equal(checkedRelease(published).href, releaseUrl());
  assert.equal(published.versionCode, 5);
  assert.equal(published.versionName, '1.2.1');
  assert.equal(published.minSdk, 29);
  assert.equal(published.fileSize, 9079168);
  assert.equal(published.sha256, '435CBF933C4820959CA32091DBE88D67A2FE39F150115409F8BB8C512BE16512');
  assert.equal(published.publishedAt, '2026-10-06T06:20:59.4465423+00:00');
});

test('复制群号成功或失败都反馈正确号码，不影响下载发布状态', async () => {
  const inline = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  for (const denied of [false, true]) {
    let listener, copied;
    const button = {addEventListener: (event, fn) => { assert.equal(event, 'click'); listener = fn; }};
    const feedback = {textContent: '', hidden: true};
    vm.runInNewContext(inline, {
      document: {getElementById: id => id === 'copy-group' ? button : feedback},
      navigator: {clipboard: {writeText: async text => { if (denied) throw Error('denied'); copied = text; }}},
      setTimeout: () => 1, clearTimeout() {}
    });
    await listener();
    assert.equal(copied, denied ? undefined : '549013926');
    assert.equal(feedback.hidden, false);
    assert.match(feedback.textContent, denied ? /549013926.*手动复制/ : /已复制群号 549013926/);
  }
});
