# Lukija

**[Open the live reader](https://reader.nektari.fi)** · [Reader checks](https://github.com/mikkokotila/Lukija/actions/workflows/ci.yml)

A quiet reading room for Chinese metaphysical works and their translations, without a default book identity. Paper, ink, restrained vermilion, generous typography, and a clear distinction between the root text and the voices it cites.

**The reader is a self-contained HTML file.** Runtime reading, local imports, citation formatting, offline HTML export, and EPUB export require no server-side code, external scripts, external fonts, or installation.

## Read

Open `public/index.html` in a browser, or use the deployed site. Choose **Open Markdown**, select one or more `.md` files, or paste Markdown through the library. Public Markdown URLs can also be opened. Use **Explore the typography** for a clearly labelled interface specimen, not a source translation.

Local files are read on your device, not uploaded. The public reader bundles no translation snapshots or credentials. It discovers the two configured public translation repositories on startup; full manuscript text is downloaded only when selected.

## Collection and reading rooms

**Lukija** is the permanent application identity. The **Collection** is its neutral home; **Reading room** is the current work. Returning home keeps the current work available in memory, including its position. Browser Back and Forward work within the session. Reloading does not restore imported manuscripts.

**Open in this session** contains temporary local files and opened links. **The collection** is a separate shelf for intentionally published works, starting with Yuzuan Zhouyi Zhezhong and Sanming Tonghui. No text-saving service or catalogue database is added.

Each manuscript supplies its heading. Optional flat frontmatter adds work-level identity without rewriting the text:

```yaml
---
work_title: Example work
chinese_title: 天地之理
author: Example author
translator: Example translator
edition: Study edition
---
```

The first H1 remains the displayed manuscript title; otherwise the reader uses `title` frontmatter or the filename. `work_title` identifies the parent work for a volume. Chinese titles and credits are shown only when supplied, except that a Chinese-only heading can also supply the Chinese title. Missing fields never inherit another work's branding. Metadata is displayed as text, not HTML.

## Live translations

The first two works discover their translated volumes directly from their public GitHub repositories. Each opening checks the latest file revision; background checks run every five minutes while visible. New volumes appear automatically. An open passage stays unchanged until a reader accepts the **Load latest** notice. No source changes, copied manuscripts, deployment secrets, or scheduled builds are required. See [Live collection](LIVE-COLLECTION.md) for the publication workflow, freshness guarantees, limitations, and stable book/volume links.

## Export an EPUB

Open a manuscript, then choose **Manuscript & source → Export EPUB**. On a phone, first open the contents menu. Review the title, optional creator credit, and primary language, then choose **Download EPUB**.

The EPUB contains the **current manuscript only**, in its current citation-formatting state. It includes a title page, EPUB 3 navigation, an NCX compatibility table of contents, reflowable content, Chinese language annotations and ruby, tables, semantic endnotes, and backlinks for repeated note references. It does not include browser controls, bookmarks, search highlights, or other library volumes. Metadata is taken from simple `title`, `author`, and `language`/`lang` frontmatter where present and can be edited before download. Authors are not inferred.

Export runs entirely in your browser and makes no network requests. Images are represented by descriptive online links rather than embedded; the export dialog and title page disclose this. Relative links to other locally imported manuscripts are retained as labelled text, because those manuscripts are not included. The ZIP uses uncompressed entries for a small, dependency-free implementation, so EPUBs can be larger than compressed equivalents.

The book uses reader-adjustable text size and a separate, restrained EPUB stylesheet. Exact fonts, pagination, and footnote popup behavior depend on the reading application. EPUB conformance tests do not establish compatibility with every physical device. No fonts are bundled.

**Save offline reading copy** remains available and produces a self-contained HTML file with the current Markdown embedded. That copy also retains EPUB export. Keep exported private manuscripts private when sharing either format.

## Local development

Use Node.js 22 or later:

```sh
npm ci
npm run dev
```

`public/index.html` is the reader source and standalone deliverable. `src/epub.js` and `src/catalog.js` are the EPUB and live-catalogue engines; `npm run build` embeds both into the HTML. Commit the source modules and built HTML together when changing either. There is no front-end framework or client-side package installation.

## Deploy to Cloudflare Workers

This project uses **Workers Static Assets**, with no Worker request handler and no database, storage binding, upload endpoint, or manuscript proxy. Only `public/` is deployed. The configured Worker name is `lukija`.

```sh
npm ci
npx wrangler login
npm run deploy
```

Wrangler prints the deployed `workers.dev` URL. Existing authentication can be reused. The project does not contain an account ID or API token. Security headers are defined in `public/_headers`. A custom 404 prevents missing Markdown files from masquerading as successful HTML responses.

### Continuous deployment

Two supported choices; use one, not both:

**Cloudflare's Git integration:** In the Worker's **Settings → Builds → Connect**, select `mikkokotila/Lukija`, production branch `main`, repository root `/`, build command `npm run build`, and deploy command `npx wrangler deploy`. Authorize the Cloudflare GitHub App for this repository. Connecting the repository is a separate account-level step from a successful CLI deployment.

**The included GitHub Actions workflow:** Add repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Use a scoped Cloudflare deployment token for this account; do not copy a local OAuth session into GitHub. Set the repository variable `CLOUDFLARE_DEPLOY_ENABLED` to `true`. Pushes to `main` will then deploy **only after** browser tests and EPUBCheck pass. Pull requests run tests but never receive deployment credentials. Until the variable and secrets are set, the deploy job is intentionally skipped.

### Cloudflare Pages alternative

The same `public/` directory can be published with Pages. Connect the repository in Pages with framework **None**, build command `npm run build`, output directory `public`, and production branch `main`. No Pages Functions are needed. The Workers configuration is for Workers deployments, not a Pages Functions setup. There is no reason to provision both a Pages project and a Worker for the same site.

## Test

```sh
npm ci
npx playwright install chromium
npm test
```

The Playwright suite exercises desktop and phone layouts, root/citation separation, unchanged Markdown, EPUB package structure, XML validity, metadata escaping, language tags, navigation destinations, repeated note backlinks, offline export, image disclosure, unsafe markup rejection, error recovery, filename limits, and offline HTML round trips.

CI also validates every generated test EPUB with **EPUBCheck 5.4.0** and fails on warnings. To run it locally, install Java 11 or later, download the official EPUBCheck release, and set its JAR path:

```sh
EPUBCHECK_JAR=/path/to/epubcheck.jar npm run test:epub
```

Test manuscripts are synthetic. They are not excerpts copied from the translation repositories. Catalogue tests mock GitHub, including revisions, new volumes, stale CDN replies, and failures, without consuming live API quota. Test exports and reports are ignored by Git.

## Manuscripts and configuration

The `CONFIG` object has no default source repository, initial manuscript, or book identity. Keep `autoLoad` false for the neutral collection. The independent `WORKS` registry in `src/catalog.js` defines the live, multi-work catalogue; it does not use these legacy single-repository settings. Configure the optional public repository fields to enable **Refresh published collection**, which checks a same-site `reader-manifest.json` before repository discovery. This is the existing opt-in loader, not a text-storage service.

`public/reader-manifest.example.json` is an example, not an active catalogue. Only publish a manifest when its files exist and are intended to be public. Anything deployed under `public/` can be public regardless of `.gitignore`.

The legacy browser-storage prefix preserves existing preferences and bookmarks. Imported manuscripts are not written to browser storage. Work identity is derived independently for each manuscript.

Explicit Markdown blockquotes (`>`) are always respected. Automatic citation formatting recognizes attributed quotations with matching quotation marks, while uncertain boundaries stay inline. See [CITATION-FORMATTING.md](CITATION-FORMATTING.md). Formatting changes the rendered view, not the Markdown.

## Privacy and limitations

Imported manuscript text stays in the browser session. Preferences, positions, and bookmarks use browser storage, not a server. No analytics code is included. Public URLs and linked images contact their stated sources; Cloudflare also necessarily receives requests for the hosted application. There is no GitHub authentication flow in the reader and no client-side token field.

Markdown is rebuilt through a narrow DOM allowlist before display and export. Scriptable embeds, arbitrary styles, frames, forms, SVG/MathML, and unsafe URL schemes are dropped. Files are limited to 4 MB. This is not an unrestricted HTML renderer or a formal security audit.

Marked 4.0.19 is embedded from the existing reader, with its MIT notice retained in the HTML. It is a fixed bundled dependency, not a claim to be the newest release. No license is assigned to the translation manuscripts by publishing this reader.

## Reference documentation

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [EPUB 3.3 specification](https://www.w3.org/TR/epub-33/)
- [Official EPUBCheck](https://www.w3.org/publishing/epubcheck/)
