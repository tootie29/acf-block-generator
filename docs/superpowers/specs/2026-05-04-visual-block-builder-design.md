# Visual Block Builder — Design Spec

**Date:** 2026-05-04
**Project:** acf-block-generator (Vite + React, client-side ACF Pro block generator)
**Status:** Approved scope, awaiting implementation plan

## Goal

Add a drag-and-drop visual builder that lets a designer compose a block's layout from primitives (Section, Row, Column, Stack, Heading, Text, Image, Button, Link, Bound Repeater), bind each content element to an ACF field defined in Step 5, edit per-element styles (curated set + escape-hatch raw CSS), and on save emit production-ready BEM `template.php` + `stylesheet.css` that respect the agency conventions already enforced by the generator.

The builder replaces the hardcoded "image-on-top, content-stacked-below" output produced today by `renderPhp.js`. When a user has not interacted with the builder, the generator falls back to current behavior — backwards compatible.

## Non-goals

- Pixel-positioning (Webflow-style absolute positioning) — explicitly out of scope.
- Editing ACF field metadata inside the builder (still done in Step 5).
- Any backend / server execution of PHP for preview.
- Per-property responsive control (only a curated subset of properties are responsive).
- Multi-block templates / page-level layouts.

## Context

The current generator hardcodes layout in `src/generators/renderPhp.js`:
- Image fields rendered above the content wrapper (`mediaBlock`).
- All non-image fields rendered inside `<div class="{slug}__content">` (`contentBlock`).
- A field literally named `heading` is special-cased to use the dynamic `$heading_tag`.

Pain points:
1. No way to express two-column / split-image layouts without editing the generator.
2. No way to control per-field padding / spacing without hand-writing `stylesheet.css` after download.
3. The team can't iterate on layout in the wizard — they ship a draft, edit PHP/CSS by hand, and lose the ability to regenerate cleanly.

The visual builder closes this gap: layout becomes part of the schema; regeneration always produces the same markup the team last designed.

## Scope decisions (locked)

| Decision | Locked value |
|---|---|
| Builder vs Step 5 fields | **B**: Step 5 still defines ACF fields; builder lays them out and binds elements to fields |
| Static (unbound) elements | **Disallowed** — every content element must bind to an ACF field; layout containers (Section/Row/Column/Stack) carry no field binding |
| Inline click-to-edit on canvas | **Yes in v1** for `bemName` and inspector-equivalent text |
| Raw-CSS escape hatch in inspector | **Yes in v1**, with the visual inspector remaining the default editing path |
| Mobile breakpoint | **In Phase 1**, single 768px breakpoint, mobile-first base + desktop overrides |
| Click-to-edit text on canvas | Yes, v1 |
| Pre-made templates in v1 | "Stack" only (current default), validates the pipeline |

## Architecture

### Data model

Stored on `schema.layout` (added to `DEFAULT_SCHEMA` in `App.jsx`):

```js
schema.layout = {
  root: LayoutNode,
  selectedNodeId: string | null,
  activeBreakpoint: 'desktop' | 'mobile',
}

// LayoutNode
{
  id: string,                       // uid() — internal React key, never emitted
  type: NodeType,                   // see vocabulary below
  bemName: string,                  // produces .{slug}__{bemName}; user-editable, auto-derived from type
  boundField: string | null,        // a fieldName from schema.fields[]; null only for layout containers
  children: LayoutNode[],           // recursive; only layout containers can have children
  props: { [k]: any },              // type-specific (heading level, button label fallback, etc.)
  style: {
    desktop: StyleObject,
    mobile:  StyleObject,           // only properties listed in RESPONSIVE_KEYS may appear here
    customCss: string,              // raw CSS injected verbatim into the final rule body
  },
}

// NodeType (Phase 1 vocabulary)
type NodeType =
  | 'section' | 'row' | 'column' | 'stack'   // layout (no boundField)
  | 'heading' | 'text' | 'image'              // content (boundField required)
  | 'button' | 'link'                          // CTA (boundField required, type=link)
  | 'repeater'                                 // boundField required, type=repeater; children render per row

// StyleObject — curated keys only (Phase 1)
{
  padding?: string,           // e.g. "32px" or "16px 24px"
  margin?: string,
  gap?: string,
  background?: string,        // hex or var(--primary-color)
  color?: string,             // text color
  fontSize?: string,
  fontWeight?: string | number,
  textAlign?: 'left' | 'center' | 'right',
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch',
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between',
  flexDirection?: 'row' | 'column',
  borderRadius?: string,
  maxWidth?: string,
}

// RESPONSIVE_KEYS — keys allowed in style.mobile (subset)
const RESPONSIVE_KEYS = ['padding', 'margin', 'gap', 'fontSize', 'flexDirection', 'textAlign']
```

`schema.fields[]` is unchanged. The builder reads it (to populate the bind-to-field dropdown) but never writes to it.

### Component tree (new files under `src/components/Builder/`)

```
Builder.jsx              — root; lays out Palette | Canvas | Inspector
├── Palette.jsx          — left rail; primitives + pre-made templates as dnd-kit draggables
├── Canvas.jsx           — center; renders the layout tree as live HTML
│   ├── CanvasNode.jsx   — recursive renderer with drop zones between siblings
│   └── BreakpointSwitcher.jsx — top toolbar, toggles activeBreakpoint
├── Inspector.jsx        — right rail; controls for the selected node
│   ├── BemNameInput.jsx
│   ├── BindToFieldSelect.jsx
│   ├── StylePanel.jsx        — curated controls (padding, gap, background, etc.)
│   └── CustomCssTextarea.jsx — escape hatch
└── LayoutTree.jsx       — collapsible tree (alternative to canvas selection)
```

### Wizard integration (`src/App.jsx`)

Insert as **Step 6 — Layout** between current Step 5 (fields) and Step 6 (download, renumbered to 7):
- Tab/section header: "6 · Layout"
- Two-pane embedded UI: Builder fills the section.
- A "Skip — use default layout" link that clears `schema.layout` and triggers fallback emission.

The right panel's CodePreview continues to update live as the builder is used.

### Generator integration (`src/generators/`)

New file: `src/generators/layoutWalker.js`
- `emitMarkup(node, schema, depth)` → PHP+HTML string for `template.php`
- `emitCss(node, schema, slug)` → CSS rules string for `stylesheet.css`
- Pure functions; no React, no DOM

Modified files:
- `renderPhp.js`:
  - When `schema.layout?.root` exists, replace the body of `<section>...</section>` with `emitMarkup(layout.root, schema)`.
  - The header (heading-tag setup, section_id, classes, field fetches) stays unchanged — those wrap whatever the layout walker emits.
  - When layout is absent, current behavior is preserved verbatim.
- `blockCss.js`:
  - When layout exists, append `emitCss(layout.root, schema, slug)` after the existing scaffold.
  - Existing global-vars references stay in the scaffold.

### Live preview behavior (Canvas)

- Renders the layout tree as **real React HTML** in the browser — not via PHP.
- Bound fields show typed placeholders:
  - Heading → "Heading text"
  - Text → "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
  - Image → a 16:9 grey rectangle with the field name centered
  - Button/Link → button with field's label or "Click here"
  - Repeater → 2 placeholder rows of the child layout
- `style.desktop` is applied by default; toggle to mobile via `BreakpointSwitcher` to apply `{...desktop, ...mobile}`.
- Selected node gets a 2px blue outline + "selected" handle. Hover shows a 1px outline.
- Drop zones are visible only while dragging.
- Inline click-to-edit:
  - Click a heading/text node once → selects.
  - Click again → text becomes contentEditable; Enter/blur saves to `node.bemName` (NOT to the bound field — the bound field is what editors will type into in WP, not a designer in the builder).
  - Inline editing only changes the BEM name, never the placeholder content.

### Drag-and-drop semantics

- **From palette to canvas:** dropping a primitive into a layout container appends as a child. Dropping a content node directly on the section root is allowed (root counts as a container).
- **Reorder:** drag an existing node to a different drop zone. Sibling reorder + cross-container reparenting allowed.
- **Constraints enforced at drop time:**
  - Content nodes (heading/text/image/button/link/repeater) can only land in containers (section/row/column/stack/repeater children).
  - Containers can land in containers (nesting allowed).
  - Repeater children: only one layout subtree allowed (the row template).
- Drop is rejected with a brief shake animation if invalid.

### Pre-made templates

`src/lib/layoutPresets.js` — array of `{ id, label, description, tree }` where `tree` is a `LayoutNode`. Dragged from palette like primitives, but on drop replace (with confirmation) the entire layout tree.

Phase 1 ships exactly one preset:
- **"Stack"** — section > stack > [heading, text, image] (mirrors the current default output, validates round-trip)

### Style emission rules

For each node, emit two rules per breakpoint where any property is set:

```css
.hero-banner__inner {
  /* desktop properties */
}
@media (max-width: 768px) {
  .hero-banner__inner {
    /* mobile overrides — only RESPONSIVE_KEYS that differ from desktop */
  }
}
```

`customCss` is appended verbatim inside the desktop rule body **after** the inspector-emitted properties. Per CSS cascade rules, the later property wins, so custom CSS overrides the inspector — matching the "escape hatch" intent: visual builder is the default authoring path, but custom CSS lets a power user override any specific property when the inspector doesn't expose it.

Empty rule bodies are omitted entirely (no orphan selectors). Empty values are omitted.

### Markup emission rules — examples

**Layout container (no binding):**
```php
<div class="hero-banner__columns">
  {children}
</div>
```

**Bound heading (hero block):**
```php
<?php if ( $heading ) : ?>
  <<?php echo $heading_tag; ?> class="hero-banner__title">
    <?php echo esc_html( $heading ); ?>
  </<?php echo $heading_tag; ?>>
<?php endif; ?>
```

**Bound heading (inner block):**
```php
<?php if ( $heading ) : ?>
  <h2 class="inner-section__title"><?php echo esc_html( $heading ); ?></h2>
<?php endif; ?>
```

**Bound text:**
```php
<?php if ( $description ) : ?>
  <p class="hero-banner__description"><?php echo esc_html( $description ); ?></p>
<?php endif; ?>
```

**Bound image (hero with featured fallback):**
Reuses existing hero `<picture>` emission from `renderPhp.js` — layout walker delegates to the existing `renderFieldOutput` for image type so we don't duplicate the `<picture>` logic.

**Bound link/button:**
```php
<?php if ( $cta && ! empty( $cta['url'] ) ) : ?>
  <a class="hero-banner__cta"
     href="<?php echo esc_url( $cta['url'] ); ?>"
     <?php echo ! empty( $cta['target'] ) ? 'target="' . esc_attr( $cta['target'] ) . '"' : ''; ?>>
    <?php echo esc_html( $cta['title'] ); ?>
  </a>
<?php endif; ?>
```

**Bound repeater (with child layout subtree as the row template):**
```php
<?php if ( have_rows( 'features' ) ) : ?>
  <div class="hero-banner__features">
    <?php while ( have_rows( 'features' ) ) : the_row(); ?>
      <div class="hero-banner__feature">
        {child layout, with $name → get_sub_field( 'name' )}
      </div>
    <?php endwhile; ?>
  </div>
<?php endif; ?>
```

The `{child layout}` is emitted by re-walking the repeater's children with a flag that swaps `get_field()` calls for `get_sub_field()` (existing pattern in `renderPhp.js:111`).

## Phase 1 (MVP) — what ships first

- `schema.layout` data model + serialization.
- `src/components/Builder/` — Palette, Canvas, Inspector, BreakpointSwitcher; LayoutTree may be deferred to Phase 1.5 if time-pressured.
- All 10 Phase-1 primitives: Section, Row, Column, Stack, Heading, Text, Image, Button, Link, Repeater.
- Drag-from-palette + drag-to-reorder + drag-into-container.
- Inspector with curated style controls + Custom-CSS textarea + Bind-to-field dropdown.
- Mobile breakpoint with `RESPONSIVE_KEYS` overrides.
- Inline click-to-edit for `bemName` on heading/text nodes.
- Live React preview with placeholder content for bound fields.
- Generator emits valid `template.php` + `stylesheet.css` for all 10 primitives.
- One pre-made template ("Stack").
- Backwards compat: when `schema.layout` is absent, current `renderPhp.js` behavior unchanged.

## Phase 2 (deferred)

- 4 more pre-made templates: Hero split L/R, Hero centered, Two-column features, Card grid.
- Save current layout as a custom user template.
- Tree view component.
- Undo/redo.
- Copy-paste subtrees.

## Phase 3 (deferred)

- More primitives: List, Quote, Gallery (multi-image bound).
- Per-property responsive control (any style key, not just `RESPONSIVE_KEYS`).
- Tablet breakpoint (768–1024px).
- Theme palette editor (define `--primary-color` etc. in the wizard).

## Risks & open notes

1. **dnd-kit nested sortable contexts:** dnd-kit handles nested `SortableContext` but the canvas-as-tree pattern requires careful sensor configuration to avoid hijacking palette drags. Mitigation: prototype palette → canvas drag first, then add intra-tree reorder. If it gets gnarly, fall back to a click-to-add-then-arrow-keys-to-reorder UI for nested moves.
2. **Inline click-to-edit conflict with selection:** clicking once selects, clicking again edits. Need a deliberate threshold (timeout or explicit double-click) so users don't accidentally enter edit mode while reordering. Will tune during implementation.
3. **Custom CSS escape hatch and BEM hygiene:** the textarea writes raw CSS into the rule body. Users could write nested selectors or `!important` and break the BEM contract. Mitigation: lint the textarea (warn but don't block) for obvious red flags (nested selectors, non-relative `>` combinators referencing other classes).
4. **Layout-vs-Step-5 sync:** if the user deletes a field in Step 5 that's bound by a layout node, the node's `boundField` becomes a dangling reference. Mitigation: on field deletion, scan the layout tree and either (a) clear the binding (node turns red in canvas, shows "Field missing" in inspector), or (b) confirm-and-cascade-delete the node. Pick (a) for v1 — non-destructive.
5. **Schema migration:** any existing user state (none right now, no persistence) wouldn't have `schema.layout`. Adding the key with default `null` is a no-op, so no migration needed.
6. **Live preview accuracy:** the React canvas preview won't match WP frontend rendering 1:1 because real fields have real values, hero `<picture>` elements have featured-image-on-mobile, etc. Acceptable for v1 — the Code Preview tab still shows the actual generated PHP/CSS for verification.
