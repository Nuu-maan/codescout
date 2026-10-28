---
name: taste
description: A living record of one person's taste in interfaces, read from their tasteboard and from what they say while building. Use whenever adding, editing or reviewing anything a person will see (layout, components, copy, motion, icons, color, type), and update this file whenever they reveal more of their taste.
---

# Taste

This file is a living record of one person's taste. It starts almost empty and gets better in two ways: from their board (`board/`, the screenshots, sites and notes they saved) and from what they say while you build with them. You are the one who keeps it.

Tasteboard writes `board/` and replaces it when the board changes. It never touches this file once it exists.

## How to keep this file

1. **Load it before any change a person will see.** Follow what's written here over your own defaults. Where it says nothing, do the plain thing and keep it small.
2. **Read the board when it has something new.** `board/BOARD.md` lists every thing on the board, group by group. A thing is new when its id isn't under "From the board" below. For each new thing:
   - a picture: open its file in `board/images/` and look at it;
   - a site: open the link and look at the page itself, not only its picture;
   - a note, or the "why" line under a thing: those are the person's own words, and they outrank what you see.

   Things in one group were put together on purpose. A group with a name was made by hand, and the name is their own word for what its things share. Ask what a group shares before asking what each thing is.
3. **Write what repeats, in numbers.** One screenshot is an example. Three that agree are a rule. Measure: hex values, px, radii, type sizes and weights, line heights, durations, curves, columns, the space between things. "Clean" and "modern" are not rules. "Radius 24 on blocks, 12 on 36px controls" is. Say which things each rule came from. Where the board disagrees with itself, write both down and ask.
4. **Listen while you build.** When the person corrects, praises or rejects something, that is taste. Fix the work, then refine the rule it touches (change a rule before adding one that contradicts it) and add a dated line to the taste log: their words in quotes, and what changed. What they say in the code beats what the board suggests.
5. **Keep what was sent back.** Something tried and rejected goes under "Tried and sent back" with their words, so it isn't tried a second time.
6. **Write only what you know.** Don't fill a section from one example, or from your own preference. An empty section is better than an invented one. Dates are written out (2026-10-14), never "today".

## Taste

What has been asked for, and so what every change must respect.

- **Premium, clean, and never cheap or AI-generated.** Their own words, three notes in a row. Gradients, glows, sparkle icons, heavy borders and badge clutter all read as cheap here. Quiet grey surfaces and one near-black accent read as premium.
- **Look like shwn.design and anishfn.ink.** Both are a single narrow column on an off-white page, grey body text with near-black emphasis, flat grey surfaces, almost no borders, and small precise type. Craft goes into one or two details (an animated hero, a tactile control), not into decorating everything.
- **Smooth animations.** Every state change moves: presses scale, things fade and blur in, nothing pops or snaps. See Motion.
- **Depth from fill and hairline rings, not borders or drop shadows.** On anishfn.ink there is one border on the whole page. Raised things get a 1px ring at 6% black plus a tiny soft shadow.
- **Color only for meaning.** The only hue on either site is a status green (`#16a34a`). Everything else is greyscale.

## Visual system

| Token | Value | From |
| --- | --- | --- |
| Page background | `#fbfbfb` light, `#1a1a1a` dark | both sites (anishfn.ink dark mode) |
| Body text | `#6e6e6e` light, `#a3a3a3` dark | anishfn.ink `#6e6e6e`, shwn.design `#707070` |
| Emphasis text, headings | `#171717` light, `#f2f2f2` dark | anishfn.ink |
| Surface (tiles, icon wells, secondary buttons) | `#f2f2f2` light, `#232323` dark | both sites |
| Surface hover | `#ececec` light | anishfn.ink |
| Primary button | `#171717` fill, `#fbfbfb` text; inverted in dark (`#f2f2f2` fill, `#1a1a1a` text) | anishfn.ink "Say hi" |
| Secondary button | surface fill, emphasis text, no border | anishfn.ink "Book a call" |
| Status color | `#16a34a` green, only for live or success states | anishfn.ink "Open to work" dot |
| Raised ring (floating bars, cards) | `0 0 0 1px rgb(0 0 0/.06), 0 1px 2px -1px rgb(0 0 0/.06), 0 2px 4px rgb(0 0 0/.04)` | anishfn.ink, 9 uses |
| Popover shadow | `0 0 0 1px rgb(0 0 0/.06), 0 4px 8px -2px rgb(0 0 0/.06), 0 12px 24px -4px rgb(0 0 0/.08)` | anishfn.ink |
| Radius, 34px buttons | 12px | anishfn.ink |
| Radius, 44px icon wells | 13px | anishfn.ink |
| Radius, list rows | 14px | anishfn.ink |
| Radius, tiles and cards | 20px (anishfn.ink), up to 28px for big blocks (shwn.design) | both |
| Radius, small chips | 6px | shwn.design, 47 uses |

## Type

- One sans for everything: Geist (anishfn.ink) or Public Sans (shwn.design). Mono only for code, paths and numbers that tick.
- Small and even: body 13 to 15px; 13px/20.8px is the most common size on anishfn.ink, 15px/22.5px on shwn.design. Page title 22px/500. Nothing larger except a deliberate hero line.
- Two weights: 400 for text, 500 for names, buttons and emphasis. No bold headings.
- Emphasis is color, not weight: a word goes from grey `#6e6e6e` to near-black `#171717`.
- Section labels are lowercase, 12 to 13px, grey, with a count: "work / 06".
- Letter spacing normal; only big titles tighten (about -0.02em).

## Layout

- One centered column: 628px of content (676px with 24px side padding) on anishfn.ink, about 366px on shwn.design. Header, sections and footer share its edges.
- Space separates sections, not rules or boxes: about 64px between sections, 12px of vertical padding in list rows, 16px gap between a row's icon well and its text.
- List rows: 44px icon well (surface fill, 13px radius), name in emphasis color over a grey one-line description, a small arrow at the far right.
- Buttons are 34px tall with 14px side padding and an 8px icon gap.
- Small floating chrome: anishfn.ink keeps a "Jump to…" bar floating at the bottom center with the raised ring, instead of a full-width bar.

## Motion

- One curve for almost everything: `cubic-bezier(0.23, 1, 0.32, 1)`, 150 to 300ms (anishfn.ink). Plain color changes use 150 to 200ms ease-out.
- Presses scale: buttons transition `scale, background-color, color, opacity` over 150ms; tiles scale over 200 to 300ms.
- Labels enter with opacity, blur(3px) and a 2px rise (`stage-label-in` on anishfn.ink). Opacity fades take 150 to 200ms.
- Swaps go out with opacity and a small scale, never a hard cut.

## Copy

- First person and plain: "I build products end to end", "I'm open to work". No marketing voice.
- Lowercase is fine for labels and descriptions ("an input that becomes what you mean.").

## Tried and sent back

## From the board

One line for each thing read: its id, what it is, and what was taken from it.

- `4d238f38-2fea-4b5d-bccf-a7d719ef85ff`, note "i want it to look premium": the premium rule under Taste.
- `dc34b886-47c9-4e27-bda3-e3333f12f382`, note "clean": greyscale, no borders, one column.
- `6622c71e-d4f8-4376-a5f2-779388938aed`, note "not so cheap or AI generated": no gradients, glows, sparkles or badge clutter.
- `c0c8dbad-0d04-475b-9f1b-fe883891a82c`, note "smooth animatinos": the Motion section.
- `15f0c599-d87e-420f-ab9b-d88a83480102`, note pointing at https://shwn.design/ and https://anishfn.ink/: both opened and measured in light, dark and at 390px. Colors, radii, type, spacing, shadows and curves above come from their computed styles.

## Taste log

- 2026-10-28: First board read. Five notes: "premium", "clean", "not so cheap or AI generated", "smooth animatinos", and two reference sites, shwn.design and anishfn.ink. Rules written from measurements of both sites.
