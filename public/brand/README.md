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
nothing.

## Where the lockup is drawn

`app/lockup.tsx` is the only place any of this is drawn on screen, and the
landing, notebook and welcome headers all use it. It holds ONE copy of the
three paths; the reversed lockup is a colour prop, not a second drawing, which
is all `lockup-reversed.svg` itself changes. `app/opengraph-image.tsx` imports
the mark from there rather than keeping its own. `tests/brand.test.ts` pins the
paths, the two group transforms and the viewBox against the files here, so the
screen and this folder cannot drift.

It is inlined rather than served as an `<img>`: no second request, nothing that
can 404, and it inherits no styling it should not. It stops being selectable
text, which is the ordinary trade for a logo — hence `role="img"` and
`aria-label="ExtraLesson"`.

**The header used to render the wordmark as HTML text, and this note used to
say that was correct and must not be changed.** It was wrong. The √e reading
depends on the bar overhanging the e with a few pixels of clearance at the
floor, and that clearance is a property of the outlined wordmark's own metrics.
Rebuilt in CSS against a webfont it lands differently per browser and reads as
a tick colliding with a letter — and the lockups sat in this folder unused,
which defeats having drawn them.

## Where the mark stands in alone

The notebook header at 360px has **44px** free beside its fixed right-hand
group — measured, not guessed — so the lockup cannot have its 120px there and
the row wraps if it is forced. That header shows the mark alone below the first
breakpoint and the full lockup from `sm` up. The landing and welcome headers
have the room and carry the lockup at every width.

Every header currently sits on paper, so all three use the ink tone.
`lockup-reversed.svg` is for a header on ink, and nothing is on ink today.
