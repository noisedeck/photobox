# Photobomb Design

Web-based Photo Booth clone powered by noisemaker shader pipeline.

## Concept

Camera feed rendered through GPU effects. 3x3 live preview grid with curated effect tabs. Click to go full-size, capture photos or record video. Bottom filmstrip gallery. Dark cinematic aesthetic.

## Architecture

Single renderer, multi-surface. One `CanvasRenderer` on one canvas. Camera via `getUserMedia()`, fed as the `media()` effect's external texture.

DSL pipeline: camera writes to `o0`, branches to 8 effects writing to `o1`-`o7` (center tile reads `o0` directly as "Normal"). Final compositing pass tiles the 9 results into the 3x3 grid.

Full-size mode: renderer switches to a single-effect DSL chain at full resolution.

Bundle pattern: same as layers -- `bundle.js` (CDN loader), `renderer.js` (PhotobombRenderer wrapper), `index.js` (facade). No build step, plain ES modules, http-server.

## Effect Mapping

### Tab 1: Effects (style filters)

| Tile | Photo Booth | Noisemaker | Notes |
|------|-------------|------------|-------|
| 1 | Sepia | `grading` | Warm tone shift |
| 2 | B&W | `grading` | Saturation to 0 |
| 3 | Glow | `vaseline` or `blur` | Bloom/soft focus |
| 4 | Comic Book | `edge` + `posterize` | Chained effects |
| **5** | **Normal** | *(none)* | Raw camera |
| 6 | Color Pencil | `edge` | Edge detection |
| 7 | Thermal | `grading` | False color palette |
| 8 | X-Ray | `grading` | Invert + high contrast |
| 9 | Pop Art | `posterize` | Reduced colors, high saturation |

### Tab 2: Distortions (geometric)

| Tile | Photo Booth | Noisemaker | Notes |
|------|-------------|------------|-------|
| 1 | Bulge | `bulge` | Direct match |
| 2 | Dent | `pinch` | Inverse of bulge |
| 3 | Twirl | `spiral` | Direct match |
| 4 | Squeeze | `lens` | Barrel distortion |
| **5** | **Normal** | *(none)* | Raw camera |
| 6 | Mirror | `flipMirror` | Direct match |
| 7 | Light Tunnel | `tunnel` | Direct match |
| 8 | Fish Eye | `lens` | Wide-angle distortion |
| 9 | Stretch | `waves` or `warp` | Vertical stretch |

Effect mapping is approximate; individual effects will be tuned during implementation.

## UI Layout

### Grid View (default)

```
+--------------------------------------------------+
|                   PHOTOBOMB                       |
+--------------------------------------------------+
|                                                   |
|  +----------+ +----------+ +----------+          |
|  | Effect 1 | | Effect 2 | | Effect 3 |          |
|  +----------+ +----------+ +----------+          |
|  +----------+ +----------+ +----------+          |
|  | Effect 4 | | NORMAL   | | Effect 6 |          |
|  +----------+ +----------+ +----------+          |
|  +----------+ +----------+ +----------+          |
|  | Effect 7 | | Effect 8 | | Effect 9 |          |
|  +----------+ +----------+ +----------+          |
|                                                   |
|          [ Effects ]  [ Distortions ]              |
+--------------------------------------------------+
|  [thumb] [thumb] [thumb] ...              scroll  |
+--------------------------------------------------+
```

### Full-Size View (after clicking a tile)

```
+--------------------------------------------------+
|                   PHOTOBOMB                       |
+--------------------------------------------------+
|                                                   |
|           +------------------------+              |
|           |                        |              |
|           |    FULL-SIZE EFFECT    |              |
|           |      LIVE PREVIEW      |              |
|           |                        |              |
|           +------------------------+              |
|                                                   |
|         [Photo | Video]    mode toggle            |
|              [ CAPTURE ]   shutter button         |
|          [Grid]            "Effect Name"          |
+--------------------------------------------------+
|  [thumb] [thumb] [thumb] ...              scroll  |
+--------------------------------------------------+
```

## Interaction Flow

1. App opens, requests camera permission
2. Grid view shows 3x3 live previews with default "Effects" tab
3. Tab buttons switch between Effects and Distortions
4. Click any tile -> transitions to full-size view of that effect
5. In full-size: toggle Photo/Video mode
6. Photo capture: 3-2-1 countdown, screen flash, capture to gallery
7. Video capture: press to start recording (red indicator + timer), press again to stop
8. Grid button returns to 3x3 view
9. Filmstrip at bottom shows all captures; click to preview/download/delete

## Data Flow

```
getUserMedia() -> video element -> media() external texture
                                         |
                                  write to surface o0
                                         |
                  +----------------------+----------------------+
                  |                      |                      |
          read(o0)->effect1      read(o0)(normal)       read(o0)->effectN
          write(o1)              (direct from o0)       write(oN)
                  |                      |                      |
                  +----------------------+----------------------+
                                         |
                                Grid compositor
                                (tiles o0-o7 into 3x3)
                                         |
                                      Canvas
```

## Capture Pipeline

- **Photo:** `canvas.toBlob()` from full-size render. 3-2-1 countdown with screen flash animation.
- **Video:** `MediaRecorder` on `canvas.captureStream()`. Red recording indicator, elapsed timer. Stop button replaces shutter during recording.
- **Gallery:** Blobs stored in memory + IndexedDB for persistence. Thumbnails in filmstrip. Click to preview, download, or delete.

## File Structure

```
photobomb/
  public/
    index.html
    js/
      app.js                  PhotobombApp - main orchestrator
      noisemaker/
        bundle.js             CDN loader
        index.js              Re-exports
        renderer.js           PhotobombRenderer wrapper
        vendor/               Local fallback bundles
      camera.js               getUserMedia wrapper
      capture.js              Photo/video capture logic
      gallery.js              Filmstrip + IndexedDB storage
      effects.js              Effect presets & tab definitions
      grid.js                 3x3 grid compositor logic
    css/
      colors.css
      layout.css
      components.css
      fonts.css
    manifest.json             PWA
  package.json
  tests/
```

## Visual Style: Dark Cinematic

- Background: near-black (#0a0a0a)
- Grid tiles: thin 1px border, subtle rounded corners, slight gap
- Active/hover: soft glow outline (white at 20% opacity)
- Shutter button: large circular, red accent for video, white for photo
- Filmstrip: frosted glass strip (backdrop-filter: blur) along bottom
- Typography: clean sans-serif, minimal labels (effect names on hover)
- Transitions: smooth fade between grid and full-size views
- Countdown: large centered numerals with subtle pulse animation
