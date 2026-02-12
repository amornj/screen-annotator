# Annotate

Minimal, keyboard-driven Chrome extension for on-screen annotation. Zero dependencies, no build step. Manifest V3.

## Install

1. Clone this repo
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** → select this folder
5. Click the extension icon on any page to start annotating

## Usage

Click the toolbar icon to activate the annotation overlay. Click again to toggle off. Click the floating indicator for a quick shortcut reference.

### Tools

| Key | Tool |
|-----|------|
| `D` | Freehand draw |
| `A` | Arrow |
| `C` | Circle / Ellipse |
| `T` | Text |

### Colors

| Key | Color |
|-----|-------|
| `1` | Red |
| `2` | Blue |
| `3` | Green |
| `4` | Yellow |

### Other Shortcuts

| Key | Action |
|-----|--------|
| `Arrow Up` / `Arrow Down` | Line width (or font size in text mode) |
| `Cmd/Ctrl+Z` | Undo |
| `Cmd/Ctrl+Y` | Redo |
| `Alt` / `Option` (hold) | Click-through to page (cursor changes to default) |
| `Escape` | Exit — prompts to save screenshot |

### Text Tool

- Click to place text
- Type your annotation
- **Enter** or **Escape** to confirm
- **Shift+Enter** for a new line
- **Alt/Option + Arrow Up/Down** to resize font while typing
- **Arrow Up/Down** to resize font when not typing
- Click outside to confirm
- After confirming, all shortcuts (D/A/C/T, 1-4, Escape) work immediately

### Screenshot

When you press Escape, a dialog asks "Save screenshot before closing?":
- **Yes** — captures the page with your annotations, copies to clipboard, and downloads as `annotate-YYYY-MM-DD-HHmmss.png`
- **No** — closes the overlay without saving

## Documentation

- [Support](docs/support.md) — shortcuts, usage guide, and FAQ
- [Privacy Policy](docs/privacy-policy.md) — no data collection, fully local

HTML versions are available in the `docs/` folder for web hosting.

## File Structure

```
manifest.json   — MV3 config (activeTab + scripting)
background.js   — Service worker: inject on icon click, captureVisibleTab relay
content.js      — Canvas overlay, tools, keyboard shortcuts, undo/redo, screenshot
content.css     — Overlay and UI styles (CSS-isolated from host page)
icons/          — Extension icons
docs/           — Support, privacy policy (md + html)
```
