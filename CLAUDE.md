# CLAUDE.md — Annotate

## Project
Minimal keyboard-driven Chrome extension for on-screen annotation.
- **Repo**: https://github.com/amornj/screen-annotator.git
- **Chrome Web Store**: Submitted for review (Feb 12, 2026)
- **Tech**: Manifest V3, zero dependencies, no build step, vanilla JS

## File Structure
```
manifest.json   — MV3 config (activeTab + scripting)
background.js   — Service worker: inject on icon click, captureVisibleTab relay
content.js      — Core engine (~18KB): canvas overlay, tools, keyboard, undo/redo, screenshot
content.css     — Overlay + UI styles (CSS-isolated with all:initial)
icons/          — PNGs (16/32/48/128) + generate_icons.py
docs/           — support, privacy-policy (md + html), docs.html landing page
```

## Architecture
- **Action-based undo/redo**: Stores `{type, points, color, lineWidth, ...}` per action. `replayAll()` clears canvas and re-renders all actions. No ImageData snapshots.
- **On-demand injection**: No `content_scripts` in manifest. Background uses `chrome.scripting.executeScript` on icon click. Re-click sends `toggle-off` message.
- **CSS isolation**: `all: initial` on all injected elements prevents host page interference.
- **DPR scaling**: Canvas dimensions multiplied by `devicePixelRatio`, `ctx.scale()` applied.
- **Screenshot flow**: Hide overlay → `captureVisibleTab` → composite annotation canvas on top → clipboard + download PNG.
- **Platform detection**: Shows Cmd/Option on Mac, Ctrl/Alt on Windows in help popup.

## Tools & Shortcuts
- Tools: D (draw), A (arrow), C (circle), T (text)
- Colors: 1 (red), 2 (blue), 3 (green), 4 (yellow)
- ArrowUp/Down: line width (draw/arrow/circle) or font size (text mode)
- Alt+ArrowUp/Down: font size while actively editing text
- Cmd/Ctrl+Z: undo, Cmd/Ctrl+Y: redo
- Alt/Option hold: click-through (pointer-events:none, cursor resets to default)
- Escape: exit dialog (save screenshot or close)
- Click floating indicator: help popup with all shortcuts

## Resolved Bugs
- **Text click-away re-spawn**: `onClickOutside` now calls `e.stopPropagation()` to prevent canvas mousedown from creating a new text input.
- **chrome:// injection error**: `background.js` guards against `chrome://`, `chrome-extension://`, and Chrome Web Store URLs before injecting.

## Conventions
- No build tools, no dependencies — keep it vanilla
- All DOM elements scoped under `#annotate-root`
- CSS variables for dynamic state: `--annotate-color`, `--annotate-width`
- Capture-phase keyboard listeners with `stopPropagation` to intercept before page handlers
- Commit messages: imperative mood, body explains "why"
