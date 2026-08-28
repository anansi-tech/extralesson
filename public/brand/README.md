# ExtraLesson brand assets

The √e lockup is primary: the radical, then the wordmark. `lockup.svg` is the
horizontal one, `lockup-stacked.svg` the vertical; `-black` and `-reversed` are
the single-colour variants for a dark ground and for print.

Colours are the copybook tokens — `--red #C1121F` for the mark, `--paper
#FBF7EE` where it is knocked out, `--ink #1E2430` for the wordmark.

## The favicon and the avatar are DIFFERENT DRAWINGS. Do not regenerate them.

`favicon.svg` and `avatar.svg` are **not** `mark.svg` scaled down, and nothing
should "tidy that up" by deriving them from it:

| | container | radical | stroke | starts at |
|---|---|---|---|---|
| `mark.svg` | none, transparent | red on whatever is behind | 11 | `M6 44` |
| `favicon.svg` | filled red rounded square | knocked out in paper | 15 | `M14 48` |
| `avatar.svg` | filled red circle | knocked out in paper | 13 | `M18 50` |

The reason is 16px. The mark is a stroked radical with nothing behind it, and a
thin red stroke on a white tab strip disappears — the tab reads as blank. The
favicon and avatar are therefore solid shapes with the radical reversed out of
them: a red tile is legible at any size, and the notch in it is what carries
the identity. The strokes are heavier and the geometry is redrawn to sit inside
its container, which is why the coordinates differ rather than merely scaling.

`app/favicon.ico` is built from `favicon-32.png` **and** `favicon-16.png` as two
entries, because the 16px drawing is not the 32px drawing shrunk either.
Pillow's ICO writer resamples one image to every size it is asked for, so the
container is written by hand — see the commit that added it.

## Minimum sizes

Below these the mark stops reading and the wordmark's serifs fill in:

| | minimum |
|---|---|
| horizontal lockup | **120px** wide |
| stacked lockup | **100px** wide |
| mark alone | **32px** |

## What is not here

`fraunces-var.ttf` is deliberately absent. The app loads Fraunces through
`next/font`, and a second copy in the repo is a font to keep in sync for
nothing. The page header renders the wordmark as HTML text in Fraunces rather
than as an image, which is correct — it stays selectable, scales with the
reader's own type size, and needs no asset. Do not swap it for a picture of
itself.

`app/opengraph-image.tsx` inlines the mark's single path rather than reading
this folder at runtime: a serverless bundle traces imports, not stray file
reads. That copy is pinned by `tests/brand.test.ts`, which fails if it and
`mark.svg` diverge.
