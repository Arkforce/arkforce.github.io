---
name: "Aziz Khodzhaev — Systems atlas"
description: "An inspectable engineering portfolio with mineral reading surfaces and acid-lime wayfinding."
colors:
  paper: "#ededeb"
  surface: "#e3e4df"
  raised: "#f7f7f3"
  ink: "#242b2c"
  muted: "#596160"
  line: "#c8ccc3"
  accent: "#c4e56b"
  accent-ink: "#233013"
  route: "#4e6421"
  error: "#9d342c"
  accent-divider: "#8aa744"
  dark-paper: "#1d2424"
  dark-surface: "#252f2d"
  dark-raised: "#303936"
  dark-ink: "#edf0e6"
  dark-muted: "#b0baad"
  dark-line: "#485346"
  dark-error: "#ffb2a5"
typography:
  display:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "clamp(3.2rem,4.55vw,4.9rem)"
    fontWeight: 600
    lineHeight: 1.01
    letterSpacing: "-.025em"
  headline:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "clamp(2.5rem,4.5vw,4.5rem)"
    fontWeight: 600
    lineHeight: 1.03
    letterSpacing: "-.025em"
  title:
    fontFamily: "Hanken Grotesk Variable, sans-serif"
    fontSize: "23px"
    fontWeight: 650
    lineHeight: 1.03
    letterSpacing: "-.02em"
  body:
    fontFamily: "Hanken Grotesk Variable, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Hanken Grotesk Variable, sans-serif"
    fontSize: "12px"
    fontWeight: 650
  code:
    fontFamily: "SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.8
rounded:
  control: "2px"
  round: "50%"
spacing:
  section: "clamp(4.5rem,8vw,8rem)"
  small: "8px"
  field-gap: "16px"
  panel-gap: "24px"
  reading-section: "36px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "15px 20px"
  button-primary-hover:
    backgroundColor: "{colors.route}"
    textColor: "{colors.paper}"
  button-preset:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  input:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "44px"
    width: "100%"
  route-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    padding: "13px 12px"
  route-mark:
    rounded: "{rounded.round}"
    width: "32px"
    height: "32px"
  artifact-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "28px"
---

# Design System: Aziz Khodzhaev — Systems atlas

## Overview

**Creative North Star: "Systems atlas"**

Systems atlas treats engineering work as a set of inspectable routes. Mineral surfaces, charcoal typography, and acid-lime selection give the interface the clarity of a wayfinding system; broad headings establish hierarchy while the reading surfaces stay quiet.

Squared panels and controls hold the content. Circular route marks connect the project selector, project index, and workflow diagrams. Physical depth belongs to the spatial model, and motion explains a selected route without becoming necessary to read the work.

This record describes the implementation in `style.css`, `index.html`, `shared.js`, `atlas.js`, `topology.js`, and the case-study family on September 24, 2026. The chosen direction is recorded in `.impeccable/surfaces/index-html.md`; product truth remains in `PRODUCT.md`. Browser capture was unavailable. The finish disposition remains **recapture** pending representative 1440px and 390px screenshots; this is source-derived documentation, not visual approval.

**Key Characteristics:**

- Mineral neutrals with acid-lime route selection.
- Self-hosted condensed headings and open reading text.
- Flat, squared content surfaces with circular wayfinding marks.
- Progressive spatial enhancement with a complete reading path.

## Colors

Mineral grays provide a quiet reading field, with charcoal structure and acid-lime wayfinding.

### Primary

- **Acid lime** (`accent`): selected project controls, selected-route detail, contact surface, and model caps.
- **Lime ink** (`accent-ink`): text on acid lime, unchanged between themes.
- **Route olive** (`route`): focus outline, code keys, and active diagram routes; the dark theme maps this role to acid lime.
- **Accent divider** (`accent-divider`): separator on lime route and contact panels.

### Neutral

- **Mineral paper** (`paper`): document background.
- **Mineral surface** (`surface`): map, request panels, and code artifacts.
- **Raised paper** (`raised`): inputs and map labels.
- **Charcoal ink** (`ink`): primary text, primary actions, selected view controls.
- **Muted mineral** (`muted`): secondary copy and supporting context.
- **Mineral line** (`line`): structural rules, field borders, and inactive map routes.
- **Validation red** (`error`): invalid output message and status, used with explanatory text.

System dark mode replaces paper, surface, raised, ink, muted, line, and error with their `dark-*` primitives. Accent and accent ink stay fixed. An explicit `data-theme` setting overrides the system preference; `atlas-theme` stores the choice when local storage is available. The 3D palette follows the same CSS roles.

**The Selection Rule.** Use acid lime to identify the selected route and its detail, and to anchor the contact surface; use the route color for focus and code emphasis.

## Typography

**Display Font:** Barlow Semi Condensed, sans-serif fallback; self-hosted Latin weight 600 through Fontsource.
**Body Font:** Hanken Grotesk Variable, sans-serif fallback; self-hosted Latin WOFF2 with weights 100–900 and swap loading.
**Code Font:** SFMono-Regular, Consolas, Liberation Mono, monospace; reserved for code and generated artifacts.

Condensed headings read as wayfinding. Hanken Grotesk supports longer explanations and precise controls. The code face is a functional exception, not a display face.

### Hierarchy

- **Display:** frontmatter display role for the homepage; case-study titles use `clamp(44px,6.5vw,84px)` with a 20ch maximum.
- **Headline:** frontmatter headline role for primary sections; restrained negative tracking and balanced wrapping.
- **Title:** body-family subheadings in case-study reading sections; project titles use the condensed family.
- **Body:** frontmatter base body role; case-study paragraphs use line-height 1.8 and a 70ch maximum. Introductory copy uses a responsive 17–20px range and 32ch maximum.
- **Label:** field labels use the frontmatter role. Supporting captions, controls, and metadata are generally 11–14px; these small styles are not a prescription for long reading text.
- **Code:** frontmatter code role for case-study artifacts; code blocks scroll horizontally and use tabular numbers.

## Layout

The shared container is capped at 1440px with 48px side gutters. At a viewport of 1100px or less, gutters become 28px; at 767px or less, 18px. Section separation follows the fluid section token. Reused local gaps cluster around 8, 16, and 24px, with no implied universal spacing scale.

The desktop atlas pairs a narrower introduction with a wider model. At the mobile breakpoint it stacks, the route selector becomes two columns, and the map uses a 285px height with plan view by default. At 1500px and above the map minimum height rises to 420px.

Featured work and the request workbench use paired columns separated by a rule. Case studies pair a reading column with a narrower artifact panel. All become single-column mobile layouts. Workflow lists move from four columns to two, and the form's paired inputs stack. Code and output regions retain local scrolling rather than widening the document.

## Elevation & Depth

CSS surfaces have no box shadows. Background tone and one-pixel rules separate the reading interface. The Three.js map alone uses directional lighting, soft shadow maps, physical materials, and raised station geometry. Map labels remain flat bordered surfaces.

**The Map Depth Rule.** Keep document surfaces flat. Reserve physical lighting, cast shadows, and raised geometry for the explanatory map.

## Shapes

Panels are square. Buttons and form controls have the minimal control radius in frontmatter. Circular route marks, diagram nodes, the theme toggle, and the contact arrow are intentional wayfinding exceptions. The AK monogram uses a solid square-like block. Do not generalize the circular markers into rounded content cards.

Use the bundled regular-weight Phosphor SVG library for arrows, map view, playback, and theme actions. Standard icons are 20px, with 16px compact controls and 26px route-opening arrows. Lettered route marks are project identifiers, not substitutes for action icons.

## Components

### Buttons

Compact, squared actions use ink on paper or the inverse primary treatment. Primary hover changes to route color with paper text on fine pointers. Preset buttons are transparent with a muted border and invert on hover. Focus uses a 3px route-color outline offset by 5px. Disabled controls use half opacity and default cursor.

Press feedback scales enabled buttons and button links to .98. Transforms use 160ms and `cubic-bezier(.23,1,.32,1)`; color transitions use 160ms CSS `ease`. Reduced motion disables transitions and press transforms.

### Inputs / Fields

Raised-paper fields use a one-pixel mineral-line border, the small control radius, and the frontmatter field dimensions. Labels stay outside fields. Validation output combines a textual decision with validation-red styling; generated examples remain identified as examples.

### Navigation

A ruled header pairs the AK block and name with quiet text links and a circular theme control. Fine-pointer link hover underlines; keyboard focus retains the shared outline. At the mobile breakpoint the workflow shortcut is hidden, the name wraps, and the remaining navigation stays visible. A focus-revealed skip link sits above the document.

### Cards / Containers

The featured project and case-study artifact panels use mineral surface, square corners, and no shadow. Supporting projects are ruled rows rather than repeated floating cards. Reading artifacts pair a small heading, monospace content, qualification text, and an optional action.

### Route selector and route marks

Project selectors combine a circular letter mark, title, supporting text, and selected-state arrow. The selected row uses acid lime with lime ink and `aria-pressed`. On mobile supporting subtitles and arrows are hidden, while the label and identifier remain.

The atlas's selected detail strip repeats the route mark and connects a direct case-study action to a sequence of named stages. Workflow diagrams reuse bordered nodes and connecting rules on reading pages.

### Spatial atlas

The SVG route diagram and semantic project controls exist independently of WebGL. Three.js loads as an enhancement and renders on demand. Pointer selection and view changes use 250ms transitions with the same cubic-bezier curve as CSS transform feedback. Keyboard selection and reduced-motion selection settle immediately.

Flow playback is opt-in, traverses the active route in five seconds, and is disabled when reduced motion is requested. Rendering pauses when hidden or outside the viewport; there is no ambient camera rotation. The model starts in plan view on narrow screens. A WebGL failure restores the static diagram and useful case-study navigation.

## Do's and Don'ts

### Do:

- **Do** bind surfaces, text, borders, and focus to the theme variables.
- **Do** use Phosphor SVG icons for actions and lettered route marks for project identity.
- **Do** keep route selection, case-study links, and useful text available without WebGL.
- **Do** keep motion optional and respect keyboard and reduced-motion instant selection.
- **Do** preserve the distinction between examples, reported outcomes, and operational evidence.

### Don't:

- **Don't** add ambient camera rotation, scroll interception, or autoplay to the atlas.
- **Don't** replace squared reading panels with rounded floating cards.
- **Don't** fabricate telemetry, dashboard captures, or evidence to fill a visual surface.
- **Don't** treat the source-derived documentation as completed visual approval.

Not canonized or repaired in this documentation pass: category-over-title labels in the project index are existing overline treatment, not a reusable heading rule; small-label legibility, map-label overlap, and 1440px/390px composition remain unverified without browser captures. There are no shipping raster assets to document.

