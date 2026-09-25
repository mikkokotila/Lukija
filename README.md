# Lukija

**[Open the live reader](https://lukija.mailme-758.workers.dev)** · [Reader checks](https://github.com/mikkokotila/Lukija/actions/workflows/ci.yml)

A quiet reading room for Markdown manuscripts, with a culturally considered Sanming Tonghui reading edition. Paper, ink, restrained vermilion, generous typography, and a clear distinction between the root text and the voices it cites.

**The reader is a self-contained HTML file.** Runtime reading, local imports, citation formatting, offline HTML export, and EPUB export require no server-side code, external scripts, external fonts, or installation.

## Read

Open `public/index.html` in a browser, or use the deployed site. Choose **Open Markdown**, select one or more `.md` files, or paste Markdown through the library. Public Markdown URLs can also be opened. Use **Explore the typography** for a clearly labelled interface specimen, not a source translation.

The supplied `mikkokotila/Sanming-Tongshui` repository is private. Its manuscripts are **not** copied into this repository or deployed. The public app therefore starts on its welcome page rather than trying to fetch private content. Download a manuscript from your private repository and open it locally in the reader. This does not upload it to Cloudflare or GitHub.

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

`public/index.html` is the reader source and standalone deliverable. `src/epub.js` is the EPUB engine source; `npm run build` embeds it into the HTML. Commit both when changing EPUB behavior. There is no front-end framework or client-side package installation.

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

Test manuscripts are synthetic. They are not excerpts copied from the private translation repository. Test exports and reports are ignored by Git.

## Manuscripts and configuration

Edit the `CONFIG` object in `public/index.html` to change the display title, Chinese title, repository, branch, initial manuscript, and storage namespace. The source repository's original spelling is preserved. `autoLoad` is intentionally `false` for this public deployment. Set it to `true` only when the configured initial manuscript is publicly accessible or intentionally served from the same site.

A public site may use `reader-manifest.json`; `public/reader-manifest.example.json` shows the shape. Do not rename it into an active manifest until its listed files exist and are intended for publication. Private manuscript directories are ignored by Git as an additional guard, not as access control. Anything under the deployed `public/` directory can be public regardless of `.gitignore`.

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
