# Support — Annotate

## Getting Started

1. Install the extension from the Chrome Web Store or load it unpacked via `chrome://extensions`
2. Click the Annotate icon in your toolbar on any page
3. Start drawing — the overlay appears with a crosshair cursor

## Keyboard Shortcuts

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

### Other
| Key | Action |
|-----|--------|
| `Arrow Up` / `Arrow Down` | Line width (or font size in text mode) |
| `Cmd/Ctrl+Z` | Undo |
| `Cmd/Ctrl+Y` | Redo |
| `Alt` / `Option` (hold) | Click-through to page (cursor changes to default) |
| `Escape` | Exit — prompts to save screenshot |

Click the floating indicator icon to see shortcuts at any time.

## Text Tool

- Press `T` to switch to text mode
- Click anywhere on the canvas to place a text input
- Type your annotation
- Press **Enter** or **Escape** to confirm
- Press **Shift+Enter** for a new line
- Press **Alt/Option + Arrow Up/Down** to resize font while typing
- Press **Arrow Up/Down** to resize font when not typing
- Click outside the text box to confirm
- After confirming, all shortcuts work immediately
- The floating indicator border reflects the current font size

## Saving Your Work

1. Press **Escape** to open the exit dialog
2. Click **Yes** to save — the annotated screenshot is copied to your clipboard and downloaded as a PNG file
3. Click **No** to close without saving

## FAQ

**The overlay doesn't appear when I click the icon.**
Make sure you're not on a restricted page (`chrome://` pages, the Chrome Web Store, or other extension pages). Chrome extensions cannot inject scripts into these pages.

**My drawings look blurry.**
The extension automatically scales for high-DPI displays. If you still see blurriness, try reloading the page and reactivating the extension.

**Can I annotate while scrolling?**
Hold the **Alt** key (**Option** on Mac) to temporarily pass mouse and scroll events through to the page. Release to resume annotating.

**Where are my screenshots saved?**
Screenshots are saved to your default downloads folder with the filename `annotate-YYYY-MM-DD-HHmmss.png` and also copied to your clipboard.

## Contact

If you encounter a bug or have a feature request, please open an issue on the [GitHub repository](https://github.com/amornj/screen-annotator/issues).
