# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

There is no `package.json` and no build/lint/test tooling — this is a deliberate design decision (see `docs/PRD.md` § 5), not an oversight. Do not introduce a bundler, transpiler, or framework unless the user asks for one.

Run locally with any static file server, since browsers block ES module `import`/`export` under `file://`:

```
npx serve
```

Then open the printed URL (`index.html` is the entry point). There are no tests to run.

## Architecture

Three-layer, framework-free ES module structure, wired together by plain `<script type="module">` imports (no bundler):

- [js/storage.js](js/storage.js) — persistence only. `loadTodos()`/`saveTodos()` read/write a single `localStorage` key (`simple-todo:v1`) as a JSON array. Parse failures fall back to `[]` rather than throwing, so a corrupted key can't crash the app.
- [js/todos.js](js/todos.js) — in-memory state + pub/sub. Loads initial state from `storage.js` once at module load (`let todos = loadTodos()`). `addTodo`/`updateTodo`/`deleteTodo`/`toggleComplete` all mutate the local `todos` array then call `notify()`, which persists via `saveTodos()` and calls every function registered with `subscribe()`. There is no framework reactivity — `subscribe` is the entire state-change mechanism.
- [js/app.js](js/app.js) — the only module that touches the DOM. Queries all elements once at load, registers `render` via `todos.subscribe(render)`, and every mutation triggers a full teardown/rebuild of `#todo-list` (`listEl.innerHTML = ''` then re-append) — there is no diffing. `currentFilter` is local UI state in this module only; it is not persisted. Sorting (completed items sink to the bottom) and per-category progress counts are recomputed from scratch in `render()`/`updateProgress()` on every call rather than cached.
- [js/categorize.js](js/categorize.js) — pure keyword-matching helper, no DOM/state dependencies. `guessCategory(title)` lowercases the title and returns the first category whose keyword list contains a substring match, or `null` if nothing matches. `app.js` calls it on every `#todo-input` keystroke to auto-set the category `<select>`, but a manual change to the select (tracked via `categoryTouched`) disables auto-suggestion until the next add.
- [js/theme.js](js/theme.js) — light/dark theme, stored under its own `localStorage` key (`simple-todo:theme`, separate from the todos key). `getTheme()` returns the explicit stored choice if one exists, otherwise follows `prefers-color-scheme` live (so it can change with the OS setting until the user overrides it via the `#theme-toggle` button, which calls `toggleTheme()`). Applying a theme means setting `data-theme` on `<html>`; both stylesheets read colors from CSS custom properties redefined under `:root[data-theme='dark']`, not from a second set of hardcoded rules.

Inline editing (`startEdit` in app.js) swaps the title `<span>`/category-tag `<span>` for an `<input>`/`<select>` pair in place, committing on Enter or `focusout` and reverting on Escape; a `relatedTarget` check on `focusout` avoids a spurious commit when focus just moves between the two edit fields.

**Categories are a fixed, hardcoded set** (`work`/`personal`/`study`) duplicated in four places that must stay in sync: `CATEGORY_LABELS` in [js/app.js](js/app.js), the `<option>`s in [index.html](index.html), the `.cat-work`/`.cat-personal`/`.cat-study` color classes in [css/style.css](css/style.css), and the keyword lists in [js/categorize.js](js/categorize.js). Adding a category means touching all four.

`docs/PRD.md` and `docs/IMPLEMENTATION_PROMPTS.md` contain the original requirements and the staged build history (5 completed steps) — check them for the reasoning behind a behavior before changing it.

## Desktop layout ([web_version/](web_version/))

A second entry point for wide screens, kept alongside the original mobile-width layout at the repo root rather than replacing it. It has its own [web_version/index.html](web_version/index.html) and [web_version/css/style.css](web_version/css/style.css) (sidebar + card-grid layout instead of the root's single narrow column), but **no JS of its own** — its `<script type="module" src="../js/app.js">` loads the same [js/app.js](js/app.js), so ES-module-relative imports inside it still resolve to the shared `js/` folder. This works only because `web_version/index.html` keeps every element ID `app.js` queries (`#todo-list`, `#todo-form`, `#todo-input`, `#todo-category`, `#filter-row`, `#progress-fill`, `#progress-text`, `#progress-by-category`, `#theme-toggle`) — renaming or removing one of those IDs in either HTML file breaks the other layout silently (no build step to catch it). Both entry points share the same `localStorage` key since they're served from the same origin.
