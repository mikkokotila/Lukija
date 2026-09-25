# Live translation collection

The first two works are **Yuzuan Zhouyi Zhezhong** (御纂周易折中) and **Sanming Tonghui** (三命通會), in that order. Both repositories are public. Each work has one card and a volume chooser, not a separate book card for each juan.

## Publication workflow

Commit translations to `main` in the relevant source repository. The reader lists `translation/` through GitHub's public Contents API. It discovers `juan-*.md` / `.markdown` automatically, including new numbered volumes; optional `front-matter` and `preface` translations are also accepted. Untranslated `source/` files, translation READMEs, and provenance files are not listed as translated volumes. Files over the 4 MB limit are listed but cannot be opened.

**Translation updates require no Lukija commit, build, redeployment, or scheduled task.** The source repositories remain authoritative. To add another work, extend `WORKS` in `src/catalog.js`, rebuild, and deploy the reader.

## Freshness and revisions

On a normal hosted visit, both directories are checked automatically. Checks repeat every **five minutes while the page is visible**, and when returning to the tab or collection after that interval. **Every volume opening rechecks its directory**, even inside the five-minute interval. A manual **Check for updates** control is also available. GitHub propagation, availability, and rate limits still apply; this is not an instantaneous push subscription.

Each selected manuscript is bound to the Git blob SHA returned by that check. Its raw download is verified against Git's content hash. A stale or mismatching CDN reply falls back to the exact blob endpoint. The displayed revision identifies the Markdown file, not a repository commit or date. Relative diagrams and source links resolve against the repository's `main` branch; images are not pinned or hash-verified with the manuscript.

An open manuscript is **never replaced mid-passage**. A newer revision produces a **Load latest** notice. Accepting it reloads and restores the section/position as closely as the revised document permits. A removed volume or failed check is disclosed. The open text remains in memory, but it is not presented as freshly verified when a new check fails.

## Linking and privacy

Use `?work=zhouyi-zhezhong&file=translation/juan-01.md` or `?work=sanming-tonghui&file=translation/juan-01.md`. These links follow the latest published revision on each opening rather than pinning readers to an old version. Existing GitHub links to these translations are recognized as collection entries too. The work ID and path, not just the filename, identify a volume, so two `juan-01.md` files never collide.

The catalogue uses no authentication, backend, database, or text storage. GitHub's unauthenticated API limit applies per reader's public IP. Conditional ETags, coalesced checks, the five-minute interval, and rate-limit backoff reduce traffic. Source errors do not block local imports. Standalone `file:` readers check public works only when requested; exported offline reading copies do not automatically connect to the catalogue. No private manuscript is uploaded.

## Testing

`npm test` includes mocked source discovery, additions, removals, revisions, stale CDN fallback, rate limits, source failures, deep links, book isolation, original Markdown integrity, relative assets, and next-volume navigation on desktop and mobile. Network mocking keeps CI deterministic and avoids live API quota. Live-source smoke tests are a separate deployment check; all automated fixtures are synthetic.

## Reference documentation

- [GitHub Contents API](https://docs.github.com/en/rest/repos/contents)
- [GitHub Git Blobs API](https://docs.github.com/en/rest/git/blobs)
- [GitHub API best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)
- [GitHub REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
