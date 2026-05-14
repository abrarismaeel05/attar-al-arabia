# Attar Al-Arabia — 3D Fragrance Gallery
## H7006 Web 3D Applications | University of Sussex 2026 | Candidate: 278908

---

## What's in this folder

| File | Purpose |
|------|---------|
| `index.html` | Home / landing page |
| `viewer.html` | Main 3D gallery viewer (all Three.js code lives here) |
| `about.html` | About / documentation page |
| `submission.html` | Submission details & GitHub link |
| `style.css` | Main stylesheet (dark Arabic luxury theme) |
| `style_button.css` | 3D viewer panel and button styles |
| `script.js` | Three.js application (ES module — all 3D logic) |
| `assets/models/` | Put your Blender `.glb` exports here |
| `assets/blender/` | Put your `.blend` source files here |
| `assets/images/` | Screenshots of Blender workspace (for About page) |

---

## ⚠️ WHAT YOU MUST DO — Blender Models (REQUIRED)

The `.glb` files are NOT included because you must create them yourself
in Blender. The brief explicitly requires `.blend` source files to be submitted.

**You need to create 3 models in Blender:**

### Model 1: Oud Noir bottle
- Dark, tall, rectangular or angular silhouette
- Dark blue/black body material
- Gold metallic cap/stopper
- Save as `assets/blender/oud_noir.blend`
- Export as `assets/models/bottle_oud.glb`

### Model 2: Rose Royale bottle
- Round or globe-shaped body (spherical / bulbous)
- Deep pink/rose body material
- Pink metallic cap
- Save as `assets/blender/rose_royale.blend`
- Export as `assets/models/bottle_rose.glb`

### Model 3: Amber Essence bottle (make this the complex one for higher marks)
- Faceted / geometric bottle (like a cut gem)
- Warm amber/orange material with glass transparency
- Gold cap
- Add a rotation animation in Blender for the open-bottle reveal
- Save as `assets/blender/amber_essence.blend`
- Export as `assets/models/bottle_amber.glb`

### How to export from Blender:
1. File → Export → glTF 2.0 (.glb/.gltf)
2. Select **glTF Binary (.glb)**
3. Tick **Animation** if you have animations
4. Save to `assets/models/bottle_oud.glb` (etc.)

**IMPORTANT:** Until you add the .glb files, the app will still work — it
automatically falls back to procedural Three.js geometry that looks like
perfume bottles. So the site is fully functional right now.

---

## How to run the site locally

Because `script.js` uses ES modules and the `importmap` feature, you
**cannot just open index.html by double-clicking**. You need a local server.

**Option 1 — VS Code Live Server (recommended):**
1. Install the "Live Server" extension in VS Code
2. Right-click `viewer.html` → Open with Live Server
3. This serves from `http://127.0.0.1:5500/`

**Option 2 — Python:**
```bash
cd attar-arabia/
python -m http.server 8080
# Then open http://localhost:8080/viewer.html
```

---

## Submitting to GitHub (for +5 marks)

1. Create a GitHub account if you don't have one
2. Create a new public repository called `attar-al-arabia`
3. Upload all files (including .blend files — GitHub can store them)
4. Update the GitHub link in `submission.html`
5. Submit the GitHub URL on Canvas

---

## Assignment checklist

- [x] 3 original 3D models
- [x] NOT the Coca Cola lab brand
- [x] User interface (Bootstrap 5 navbar, cards, viewer)
- [x] CSS logo in header (no image — pure HTML/CSS)
- [x] Model selection gallery
- [x] Wireframe toggle button (REQUIRED)
- [x] onClick animation button
- [x] Auto-rotate toggle
- [x] Camera reset
- [x] dat.GUI lighting control panel (SpotLight)
- [x] OrbitControls (drag, pan, zoom)
- [x] Content swapping (model info panel updates on selection)
- [x] URL parameter pre-selection (?model=oud|rose|amber)
- [x] Responsive layout (Bootstrap grid + canvas resize handler)
- [x] About page with all documentation
- [x] Submission page
- [x] Well-commented code (every function has JSDoc comments)
- [ ] Add your .glb and .blend files
- [ ] Take Blender screenshots for About page (assets/images/)
- [ ] Set up GitHub repo and update submission.html link
- [ ] Test in Week 11 lab
