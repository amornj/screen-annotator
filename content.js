(() => {
  // Idempotent guard — if already active, do nothing (toggle handled by message)
  if (document.getElementById("annotate-root")) return;

  // ─── State ───────────────────────────────────────────────────────────
  let tool = "draw"; // draw | arrow | circle | text
  let color = "#ff0000";
  let lineWidth = 3;
  const actions = [];
  const redoStack = [];
  let drawing = false;
  let dragStart = null;
  let currentPath = [];
  let textEditing = false;
  let activeTextEl = null;

  // ─── SVG icons for indicator ─────────────────────────────────────────
  const ICONS = {
    draw: '<path d="M3 21l1.5-4.5L17.25 3.75a1.06 1.06 0 0 1 1.5 1.5L6 18z"/><path d="M15 6l3 3"/>',
    arrow:
      '<line x1="5" y1="19" x2="19" y2="5"/><polyline points="10 5 19 5 19 14"/>',
    circle: '<ellipse cx="12" cy="12" rx="9" ry="7"/>',
    text: '<text x="12" y="17" text-anchor="middle" fill="#fff" stroke="none" font-size="16" font-weight="bold" font-family="sans-serif">T</text>',
  };

  // ─── DOM Setup ───────────────────────────────────────────────────────
  const root = document.createElement("div");
  root.id = "annotate-root";

  const canvas = document.createElement("canvas");
  canvas.id = "annotate-canvas";
  root.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  function sizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    replayAll();
  }

  // Indicator
  const indicator = document.createElement("div");
  indicator.id = "annotate-indicator";
  indicator.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[tool]}</svg>`;
  root.appendChild(indicator);
  updateIndicatorColor();
  updateIndicatorWidth();

  document.documentElement.appendChild(root);
  sizeCanvas();

  // ─── Render helpers ──────────────────────────────────────────────────
  function renderAction(a) {
    ctx.save();
    ctx.strokeStyle = a.color;
    ctx.fillStyle = a.color;
    ctx.lineWidth = a.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (a.type === "draw") {
      if (a.points.length < 2) {
        // Single dot
        ctx.beginPath();
        ctx.arc(a.points[0].x, a.points[0].y, a.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        for (let i = 1; i < a.points.length; i++) {
          ctx.lineTo(a.points[i].x, a.points[i].y);
        }
        ctx.stroke();
      }
    } else if (a.type === "arrow") {
      drawArrow(ctx, a.x1, a.y1, a.x2, a.y2, a.lineWidth);
    } else if (a.type === "circle") {
      const cx = (a.x1 + a.x2) / 2;
      const cy = (a.y1 + a.y2) / 2;
      const rx = Math.abs(a.x2 - a.x1) / 2;
      const ry = Math.abs(a.y2 - a.y1) / 2;
      if (rx > 0 && ry > 0) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (a.type === "text") {
      ctx.font = `${a.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = a.color;
      const lines = a.text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], a.x, a.y + i * a.fontSize * 1.3);
      }
    }

    ctx.restore();
  }

  function drawArrow(c, x1, y1, x2, y2, lw) {
    const headLen = Math.max(lw * 4, 12);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    // Shaft
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    // Head
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 6),
      y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    c.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 6),
      y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    c.closePath();
    c.fill();
  }

  function replayAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const a of actions) renderAction(a);
  }

  // ─── Mouse handlers ──────────────────────────────────────────────────
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseup", onMouseUp);

  function getPos(e) {
    return { x: e.clientX, y: e.clientY };
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;

    if (tool === "text") {
      startTextInput(e.clientX, e.clientY);
      return;
    }

    drawing = true;
    dragStart = getPos(e);

    if (tool === "draw") {
      currentPath = [dragStart];
    }
  }

  function onMouseMove(e) {
    if (!drawing) return;
    const pos = getPos(e);

    if (tool === "draw") {
      currentPath.push(pos);
      // Draw incremental segment
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const prev = currentPath[currentPath.length - 2];
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.restore();
    } else if (tool === "arrow" || tool === "circle") {
      // Live preview: replay + preview shape
      replayAll();
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (tool === "arrow") {
        drawArrow(ctx, dragStart.x, dragStart.y, pos.x, pos.y, lineWidth);
      } else {
        const cx = (dragStart.x + pos.x) / 2;
        const cy = (dragStart.y + pos.y) / 2;
        const rx = Math.abs(pos.x - dragStart.x) / 2;
        const ry = Math.abs(pos.y - dragStart.y) / 2;
        if (rx > 0 && ry > 0) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function onMouseUp(e) {
    if (!drawing) return;
    drawing = false;
    const pos = getPos(e);

    if (tool === "draw") {
      if (currentPath.length === 1) currentPath.push(currentPath[0]);
      actions.push({
        type: "draw",
        points: currentPath.slice(),
        color,
        lineWidth,
      });
      redoStack.length = 0;
      currentPath = [];
    } else if (tool === "arrow") {
      actions.push({
        type: "arrow",
        x1: dragStart.x,
        y1: dragStart.y,
        x2: pos.x,
        y2: pos.y,
        color,
        lineWidth,
      });
      redoStack.length = 0;
      replayAll();
    } else if (tool === "circle") {
      const rx = Math.abs(pos.x - dragStart.x) / 2;
      const ry = Math.abs(pos.y - dragStart.y) / 2;
      if (rx > 1 && ry > 1) {
        actions.push({
          type: "circle",
          x1: dragStart.x,
          y1: dragStart.y,
          x2: pos.x,
          y2: pos.y,
          color,
          lineWidth,
        });
        redoStack.length = 0;
      }
      replayAll();
    }

    dragStart = null;
  }

  // ─── Text tool ───────────────────────────────────────────────────────
  let fontSize = 18;

  function startTextInput(x, y) {
    if (textEditing) commitText();

    const el = document.createElement("div");
    el.className = "annotate-text-input";
    el.contentEditable = "true";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.setProperty("--annotate-color", color);
    el.style.setProperty("--annotate-font-size", fontSize + "px");
    el.style.color = color;
    el.style.fontSize = fontSize + "px";
    root.appendChild(el);
    el.focus();

    textEditing = true;
    activeTextEl = el;

    // Enter/Escape to confirm, Shift+Enter for newline, ArrowUp/Down for font size
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commitText();
      } else if (e.key === "Escape") {
        e.preventDefault();
        commitText();
      } else if (e.key === "ArrowUp" && e.altKey) {
        e.preventDefault();
        fontSize = Math.min(fontSize + 2, 72);
        el.style.fontSize = fontSize + "px";
      } else if (e.key === "ArrowDown" && e.altKey) {
        e.preventDefault();
        fontSize = Math.max(fontSize - 2, 8);
        el.style.fontSize = fontSize + "px";
      }
      e.stopPropagation(); // suppress tool shortcuts while typing
    });

    // Click outside text to confirm (and swallow the event so canvas doesn't start a new text input)
    function onClickOutside(e) {
      if (!el.contains(e.target)) {
        e.stopPropagation();
        commitText();
        document.removeEventListener("mousedown", onClickOutside, true);
      }
    }
    // Delay to avoid the initial click that spawned this
    setTimeout(() => {
      document.addEventListener("mousedown", onClickOutside, true);
    }, 0);
  }

  function commitText() {
    if (!activeTextEl) return;
    const text = activeTextEl.innerText.trim();
    if (text) {
      const rect = activeTextEl.getBoundingClientRect();
      actions.push({
        type: "text",
        text,
        x: parseFloat(activeTextEl.style.left),
        y: parseFloat(activeTextEl.style.top) + fontSize,
        fontSize,
        color: activeTextEl.style.color,
        lineWidth,
      });
      redoStack.length = 0;
      replayAll();
    }
    activeTextEl.remove();
    activeTextEl = null;
    textEditing = false;
  }

  // ─── Keyboard handler (capture phase) ────────────────────────────────
  document.addEventListener("keydown", onKeyDown, true);

  function onKeyDown(e) {
    // Don't intercept while typing text
    if (textEditing) return;

    const key = e.key.toLowerCase();
    const mod = e.metaKey || e.ctrlKey;

    // Undo
    if (mod && key === "z" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (actions.length) {
        redoStack.push(actions.pop());
        replayAll();
      }
      return;
    }

    // Redo (Cmd+Y or Cmd+Shift+Z)
    if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
      e.preventDefault();
      e.stopPropagation();
      if (redoStack.length) {
        actions.push(redoStack.pop());
        replayAll();
      }
      return;
    }

    // Tool switching
    if (!mod) {
      let handled = true;
      switch (key) {
        case "d":
          setTool("draw");
          break;
        case "a":
          setTool("arrow");
          break;
        case "c":
          setTool("circle");
          break;
        case "t":
          setTool("text");
          break;
        // Colors
        case "1":
          setColor("#ff0000");
          break;
        case "2":
          setColor("#2563eb");
          break;
        case "3":
          setColor("#16a34a");
          break;
        case "4":
          setColor("#eab308");
          break;
        // Line width (or font size in text mode)
        case "arrowup":
          if (tool === "text") {
            fontSize = Math.min(fontSize + 2, 72);
          } else {
            lineWidth = Math.min(lineWidth + 1, 20);
            updateIndicatorWidth();
          }
          break;
        case "arrowdown":
          if (tool === "text") {
            fontSize = Math.max(fontSize - 2, 8);
          } else {
            lineWidth = Math.max(lineWidth - 1, 1);
            updateIndicatorWidth();
          }
          break;
        case "escape":
          showExitDialog();
          break;
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  // Alt passthrough
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Alt" && !textEditing) {
        root.style.pointerEvents = "none";
      }
    },
    true
  );
  document.addEventListener(
    "keyup",
    (e) => {
      if (e.key === "Alt") {
        root.style.pointerEvents = "";
      }
    },
    true
  );

  // ─── Tool / Color helpers ────────────────────────────────────────────
  function setTool(t) {
    if (textEditing) commitText();
    tool = t;
    indicator.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[tool]}</svg>`;
    canvas.style.cursor = tool === "text" ? "text" : "crosshair";
  }

  function setColor(c) {
    color = c;
    updateIndicatorColor();
  }

  function updateIndicatorColor() {
    indicator.style.setProperty("--annotate-color", color);
  }

  function updateIndicatorWidth() {
    indicator.style.setProperty("--annotate-width", lineWidth);
  }

  // ─── Indicator drag + click ──────────────────────────────────────────
  let indDrag = false;
  let indMoved = false;
  let indOff = { x: 0, y: 0 };

  indicator.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    indDrag = true;
    indMoved = false;
    indOff.x = e.clientX - indicator.getBoundingClientRect().left;
    indOff.y = e.clientY - indicator.getBoundingClientRect().top;
  });

  document.addEventListener("mousemove", (e) => {
    if (!indDrag) return;
    indMoved = true;
    indicator.style.left = e.clientX - indOff.x + "px";
    indicator.style.top = e.clientY - indOff.y + "px";
    indicator.style.right = "auto";
    indicator.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    if (indDrag && !indMoved) showHelpPopup();
    indDrag = false;
  });

  // ─── Help popup ────────────────────────────────────────────────────
  const isMac = navigator.platform.indexOf("Mac") !== -1;
  const modKey = isMac ? "Cmd" : "Ctrl";
  const altKey = isMac ? "Option" : "Alt";

  function showHelpPopup() {
    if (document.getElementById("annotate-help")) return;

    const help = document.createElement("div");
    help.id = "annotate-help";
    help.innerHTML = `
      <div id="annotate-help-box">
        <div class="annotate-help-title">Annotate — Shortcuts</div>
        <table class="annotate-help-table">
          <tr><th colspan="2">Tools</th></tr>
          <tr><td><kbd>D</kbd></td><td>Draw</td></tr>
          <tr><td><kbd>A</kbd></td><td>Arrow</td></tr>
          <tr><td><kbd>C</kbd></td><td>Circle</td></tr>
          <tr><td><kbd>T</kbd></td><td>Text</td></tr>
          <tr><th colspan="2">Colors</th></tr>
          <tr><td><kbd>1</kbd></td><td><span class="annotate-swatch" style="background:#ff0000"></span> Red</td></tr>
          <tr><td><kbd>2</kbd></td><td><span class="annotate-swatch" style="background:#2563eb"></span> Blue</td></tr>
          <tr><td><kbd>3</kbd></td><td><span class="annotate-swatch" style="background:#16a34a"></span> Green</td></tr>
          <tr><td><kbd>4</kbd></td><td><span class="annotate-swatch" style="background:#eab308"></span> Yellow</td></tr>
          <tr><th colspan="2">Other</th></tr>
          <tr><td><kbd>&uarr;</kbd> <kbd>&darr;</kbd></td><td>Line width / font size</td></tr>
          <tr><td><kbd>${modKey}+Z</kbd></td><td>Undo</td></tr>
          <tr><td><kbd>${modKey}+Y</kbd></td><td>Redo</td></tr>
          <tr><td><kbd>${altKey}</kbd> hold</td><td>Click through</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Exit</td></tr>
        </table>
        <div class="annotate-help-hint">Click anywhere to dismiss</div>
      </div>
    `;
    root.appendChild(help);

    // Click anywhere to dismiss
    function dismiss(e) {
      e.stopPropagation();
      help.remove();
      document.removeEventListener("mousedown", dismiss, true);
    }
    setTimeout(() => {
      document.addEventListener("mousedown", dismiss, true);
    }, 0);
  }

  // ─── Exit dialog ─────────────────────────────────────────────────────
  function showExitDialog() {
    if (document.getElementById("annotate-dialog")) return;

    const dialog = document.createElement("div");
    dialog.id = "annotate-dialog";
    dialog.innerHTML = `
      <div id="annotate-dialog-box">
        <p>Save screenshot before closing?</p>
        <button class="annotate-btn-yes">Yes</button>
        <button class="annotate-btn-no">No</button>
      </div>
    `;
    root.appendChild(dialog);

    dialog.querySelector(".annotate-btn-yes").addEventListener("click", () => {
      dialog.remove();
      doScreenshotAndClose();
    });

    dialog.querySelector(".annotate-btn-no").addEventListener("click", () => {
      dialog.remove();
      teardown();
    });

    // Escape again to dismiss dialog
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        dialog.remove();
      }
    });
  }

  // ─── Screenshot + Composite ──────────────────────────────────────────
  async function doScreenshotAndClose() {
    // Hide overlay to capture clean page
    root.style.display = "none";

    // Small delay for repaint
    await new Promise((r) => setTimeout(r, 100));

    try {
      const resp = await chrome.runtime.sendMessage({
        type: "captureVisibleTab",
      });
      if (resp.error) throw new Error(resp.error);

      // Load captured page image
      const pageImg = await loadImage(resp.dataUrl);

      // Create offscreen canvas for compositing
      const offCanvas = document.createElement("canvas");
      offCanvas.width = pageImg.width;
      offCanvas.height = pageImg.height;
      const offCtx = offCanvas.getContext("2d");

      // Draw page
      offCtx.drawImage(pageImg, 0, 0);

      // Draw annotation canvas scaled to match
      offCtx.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        pageImg.width,
        pageImg.height
      );

      // Convert to blob
      const blob = await new Promise((r) =>
        offCanvas.toBlob(r, "image/png")
      );

      // Copy to clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      } catch (_) {
        // Clipboard may not be available in all contexts
      }

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const now = new Date();
      const ts = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
        "-",
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0"),
      ].join("");
      a.download = `annotate-${ts}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Annotate: screenshot failed", err);
    }

    teardown();
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // ─── Teardown ────────────────────────────────────────────────────────
  function teardown() {
    document.removeEventListener("keydown", onKeyDown, true);
    root.remove();
    chrome.runtime.sendMessage({ type: "annotate-closed" });
  }

  // ─── Toggle off message from background ──────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "toggle-off") teardown();
  });

  // ─── Window resize ───────────────────────────────────────────────────
  window.addEventListener("resize", sizeCanvas);
})();
