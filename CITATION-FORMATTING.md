# Citation-aware reading — revision 2

This revision distinguishes the main manuscript text from passages it quotes. The attribution remains outside the quotation, and only the quoted words occupy the inset reading layer. All wording, quotation marks, links, emphasis, and note references remain in source order. The original Markdown is not edited.

## Plain Markdown, automatically separated

For example, the following structural example uses the brief quotation supplied in the design feedback. The surrounding placeholder sentences are not historical source text:

```markdown
Root text before. Lie Yukou says: “What has form is born from what has no form.” Root text after.
```

The reader displays the first sentence at the normal reading measure, gives `Lie Yukou says:` its own attribution line, places the quotation in an inset block marked **Cited passage**, and returns to the normal measure for the final sentence. The opening and closing quotation marks are retained.

Recognition uses reporting cues such as `says`, `writes`, `states`, `曰`, and `云`, together with balanced quotation marks. It supports curly and straight English quotation marks, single quotation marks, Chinese corner marks, and nested marks. A quotation can span consecutive paragraphs; a heading, list, table, image-only paragraph, or other structural boundary ends that search. Immediate footnote references stay with the quotation.

Substantial standalone quotations without an attribution receive **Quoted passage**, not an invented source name. Ordinary inline quoted terms are not promoted merely because they have quotation marks. The attribution is taken from the manuscript; the reader does not verify it against external sources.

## An explicit boundary is always supported

A standard Markdown blockquote makes the quotation boundary explicit:

```markdown
Lie Yukou says:

> “What has form is born from what has no form.”

Root text resumes here.
```

An attribution can also be placed on the first line inside the blockquote. Nested Markdown blockquotes remain nested. Markdown alerts such as `[!NOTE]` keep their existing callout presentation.

Explicit `>` formatting is the dependable option for ambiguous, unfinished, or unusually structured quotations. Automatic recognition deliberately does not infer the end of an unclosed quotation, classify unquoted paraphrases, or recognize every possible attribution formula. It does not infer new citation blocks inside tables, lists, existing blockquotes, footnotes, annotations, or elements marked `class="root-text"`. Extremely dense or deeply nested input is left without automatic separation rather than subjected to unbounded inference.

To opt a passage out of inference in an authored HTML block:

```html
<div class="root-text">

This text remains in its authored paragraph layout.

</div>
```

## Reader control and source fidelity

**Reading settings → Separate cited passages** is enabled by default. Turn it off to restore ordinary paragraph layout for automatically recognized quotations. Explicit Markdown blockquotes remain styled as quotations. This setting is saved on the device when browser storage is available. Changing it does not refetch the manuscript.

**Manuscript & source** and **Save Markdown** still show and save the unchanged source. Offline reading copies include the new citation renderer. Search indexes the attribution and quoted text but excludes the added interface labels. Footnote popups and backlinks are retained. Long quotation blocks can flow across printed pages.

**Explore the typography** includes a clearly labeled example using the brief excerpt supplied in the feedback. Its surrounding explanatory text is interface copy, not a translation of the historical work.

## Validation and scope

This revision passed 85 Chromium checks: 57 content-transformation cases and 28 interface checks. They cover text and inline-element preservation, balanced and unclosed quotations, multi-paragraph and nested quotations, Chinese marks, footnotes, source downloads, offline exports, the automatic-formatting switch, search, all three screen palettes, and overflow checks at 320, 390, 768, and 1440 pixels. Test results are included in the package.

Tests used browser-rendered documents and local fixtures. The linked `translation/juan-01.md` again returned `Not Found` through the GitHub connection, so the complete translation was not tested. This is conservative typographic recognition, not textual scholarship or a guarantee of semantic classification. Actual deployment, Safari/Firefox, and device-specific fonts were not independently verified.
