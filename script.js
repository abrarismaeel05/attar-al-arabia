/**
 * Attar Al-Arabia - Three.js 3D Viewer
 * File: script.js
 *
 * H7006 Web 3D Applications
 * University of Sussex 2026
 * Candidate: 278908
 *
 * This script sets up the Three.js scene and handles all
 * the interactive features of the 3D viewer:
 *
 *   1. Scene, camera and renderer setup
 *   2. Three procedural perfume bottle models with GLB loader
 *   3. OrbitControls for mouse navigation
 *   4. dat.GUI lighting panel
 *   5. Wireframe toggle (required by brief)
 *   6. Auto-rotate toggle
 *   7. onClick spin and pulse animation
 *   8. Content swapping (model info panel)
 *   9. Responsive canvas resize
 *  10. URL parameter model pre-selection
 *  11. Ambient audio using the Web Audio API
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';

/* ============================================================
   STATE
   ============================================================ */

let scene, camera, renderer, controls, clock;
let ambientLight, spotLight, spotHelper;
let guiParams;

let currentModel  = null;
let isWireframe   = false;
let autoRotate    = true;
let isAnimating   = false;
let spinTarget    = 0;
let pulsePhase    = 0;

/* ============================================================
   AMBIENT AUDIO - autoplay on first interaction
   ============================================================ */

let audioElement  = null;
let audioOn       = false;
let audioStarted  = false;

/**
 * Creates the audio element and starts playing.
 * Called automatically on the first user click anywhere on the page.
 * Browsers require a user gesture before audio can play, so this
 * is the cleanest way to get it running without a manual button press.
 */
function startAmbientAudio() {
  if (audioStarted) return;
  audioStarted = true;

  audioElement        = new Audio('assets/sounds/perfume.mp3');
  audioElement.loop   = true;
  audioElement.volume = 0.4;

  audioElement.play().then(() => {
    audioOn = true;
    const btn  = document.getElementById('btn-audio');
    const icon = document.getElementById('audio-icon');
    if (btn)  btn.classList.add('active-btn');
    if (icon) { icon.classList.remove('fa-volume-mute'); icon.classList.add('fa-volume-up'); }
  }).catch(() => {
    // Autoplay still blocked, user can press button manually
    audioStarted = false;
  });
}

// Start audio on first click anywhere on the page
document.addEventListener('click', startAmbientAudio, { once: false });

/**
 * Sound button - toggles the audio on and off manually.
 */
window.toggleAudio = function() {
  const btn  = document.getElementById('btn-audio');
  const icon = document.getElementById('audio-icon');

  if (!audioElement) {
    startAmbientAudio();
    return;
  }

  if (audioOn) {
    audioElement.pause();
    audioOn = false;
    if (btn)  btn.classList.remove('active-btn');
    if (icon) { icon.classList.remove('fa-volume-up'); icon.classList.add('fa-volume-mute'); }
  } else {
    audioElement.play();
    audioOn = true;
    if (btn)  btn.classList.add('active-btn');
    if (icon) { icon.classList.remove('fa-volume-mute'); icon.classList.add('fa-volume-up'); }
  }
};

const loader = new GLTFLoader();

/** Hides the loading overlay once — called when the first model finishes loading. */
let overlayHidden = false;
function hideOverlay() {
  if (overlayHidden) return;
  overlayHidden = true;
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

/* ============================================================
   MODEL DATA
   Each model defines its text content and fallback colours.
   The glb path is attempted first; if not found the code
   builds a procedural bottle instead.
   ============================================================ */
const MODELS = {
  oud: {
    name:      'Oud Noir',
    subtitle:  'Ancient Wood | Black Amber | Incense',
    desc:      'The rarest aromatic material in the Arab world. Oud Noir captures the deep resinous character of aged agarwood, mixed with black amber and incense smoke. A fragrance that has been worn across the Middle East for centuries.',
    notes:     ['Oud', 'Black Amber', 'Incense', 'Sandalwood'],
    glb:       'assets/models/bottle_oud.glb',
    bodyColor: 0x0d0d1e,
    capColor:  0xD4AF37,
    accent:    0x1a1a3e,
  },
  rose: {
    name:      'Rose Royale',
    subtitle:  'Damascus Rose | Saffron | White Musk',
    desc:      'Based on the famous Damascus Rose from Syria. Rose petals, precious saffron and warm musk are combined in a round jewel-shaped bottle. One of the most recognisable floral fragrances in Arabian perfumery.',
    notes:     ['Damascus Rose', 'Saffron', 'White Musk', 'Amber'],
    glb:       'assets/models/bottle_rose.glb',
    bodyColor: 0x6b0030,
    capColor:  0xffb0c0,
    accent:    0x3d0020,
  },
  amber: {
    name:      'Amber Essence',
    subtitle:  'Warm Amber | Vanilla | Sandalwood',
    desc:      'Warm amber resin with vanilla and sandalwood in a faceted bottle inspired by the souks of Bahrain. Rich, warm and long-lasting on the skin. A classic of Arabian fragrance tradition.',
    notes:     ['Amber Resin', 'Vanilla', 'Sandalwood', 'Tonka'],
    glb:       'assets/models/bottle_amber.glb',
    bodyColor: 0x4a1e00,
    capColor:  0xffaa44,
    accent:    0x7a3a10,
  },
};

/* ============================================================
   INIT
   ============================================================ */

/**
 * Sets up the complete Three.js scene.
 * Called once when the page loads.
 */
function init() {
  clock = new THREE.Clock();

  /* Scene */
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x141420);
  scene.fog = new THREE.Fog(0x141420, 18, 35);

  /* Camera */
  camera = new THREE.PerspectiveCamera(50, getAspect(), 0.1, 100);
  camera.position.set(0, 1.5, 7);

  /* Renderer */
  const canvas = document.createElement('canvas');
  canvas.id = 'threeCanvas';
  document.getElementById('threeContainer').prepend(canvas);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(getContainerWidth(), getContainerHeight());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.useLegacyLights = false;

  /* OrbitControls - mouse drag to rotate, scroll to zoom */
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping  = true;
  controls.dampingFactor  = 0.07;
  controls.target.set(0, 0, 0);
  controls.minDistance    = 3;
  controls.maxDistance    = 20;
  controls.maxPolarAngle  = Math.PI * 0.85;
  controls.update();

  setupLighting();
  setupGUI();

  /* Floor plane */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0xd4b896, roughness: 0.6, metallic: 0.1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  window.addEventListener('resize', onResize, false);

  animate();

  /* Check URL for model parameter */
  const params = new URLSearchParams(window.location.search);
  selectModel(params.get('model') || 'oud');
}

/* ============================================================
   LIGHTING
   ============================================================ */

/**
 * Adds a hemisphere ambient light and a controllable spot light.
 * The spot light is wired up to dat.GUI below.
 */
function setupLighting() {
  ambientLight = new THREE.HemisphereLight(0xffeecc, 0x080820, 0.6);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xD4AF37, 0.8, 12);
  pointLight.position.set(0, 4, 0);
  scene.add(pointLight);

  spotLight = new THREE.SpotLight(0xffffff, 2);
  spotLight.position.set(3, 10, 5);
  spotLight.angle     = Math.PI / 5;
  spotLight.penumbra  = 0.3;
  spotLight.decay     = 1.5;
  spotLight.distance  = 25;
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.set(1024, 1024);
  scene.add(spotLight);

  spotHelper = new THREE.SpotLightHelper(spotLight);
  spotHelper.visible = false;
  scene.add(spotHelper);
}

/* ============================================================
   dat.GUI LIGHTING PANEL
   ============================================================ */

/**
 * Creates the dat.GUI panel and connects it to the spot light.
 * This satisfies the "provide buttons to control lighting" requirement.
 */
function setupGUI() {
  guiParams = {
    spot: {
      enabled:   true,
      color:     '#ffffff',
      intensity: 2,
      distance:  25,
      angle:     Math.PI / 5,
      penumbra:  0.3,
      helper:    false,
      moving:    false,
    },
    ambient: {
      intensity: 0.6,
    },
  };

  const gui = new dat.GUI({ autoPlace: false, width: 220 });
  document.getElementById('gui-container').appendChild(gui.domElement);

  const spotFolder = gui.addFolder('Spot Light');
  spotFolder.open();

  spotFolder.add(guiParams.spot, 'enabled').name('Enable')
    .onChange(v => { spotLight.visible = v; });

  spotFolder.addColor(guiParams.spot, 'color').name('Colour')
    .onChange(v => { spotLight.color = new THREE.Color(v); });

  spotFolder.add(guiParams.spot, 'intensity', 0, 8).name('Intensity')
    .onChange(v => { spotLight.intensity = v; });

  spotFolder.add(guiParams.spot, 'distance', 5, 40).name('Distance')
    .onChange(v => { spotLight.distance = v; });

  spotFolder.add(guiParams.spot, 'angle', 0.1, Math.PI / 2).name('Angle')
    .onChange(v => { spotLight.angle = v; });

  spotFolder.add(guiParams.spot, 'penumbra', 0, 1).name('Penumbra')
    .onChange(v => { spotLight.penumbra = v; });

  spotFolder.add(guiParams.spot, 'helper').name('Show Helper')
    .onChange(v => { spotHelper.visible = v; });

  spotFolder.add(guiParams.spot, 'moving').name('Animate Light');

  const ambFolder = gui.addFolder('Ambient Light');
  ambFolder.add(guiParams.ambient, 'intensity', 0, 2).name('Intensity')
    .onChange(v => { ambientLight.intensity = v; });
}

/* ============================================================
   MODEL LOADING
   ============================================================ */

/**
 * Loads or switches to the selected model.
 * Tries to load a GLB file from Blender first.
 * If the file is not found it builds a procedural bottle instead,
 * so the viewer always has something to show.
 *
 * @param {string} key - 'oud', 'rose' or 'amber'
 */
window.selectModel = function(key) {
  const data = MODELS[key];
  if (!data) return;

  isAnimating  = false;
  spinTarget   = 0;

  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }

  updateInfoPanel(data);

  document.querySelectorAll('.btn-3d-model').forEach(b => b.classList.remove('selected'));
  const btn = document.getElementById('btn-model-' + key);
  if (btn) btn.classList.add('selected');

  loader.load(
    data.glb,
    (gltf) => {
      /* GLB loaded from Blender */
      const model = gltf.scene;
      const box   = new THREE.Box3().setFromObject(model);
      const size  = box.getSize(new THREE.Vector3());
      const scale = 4 / Math.max(size.x, size.y, size.z);

      model.scale.setScalar(scale);
      model.position.sub(box.getCenter(new THREE.Vector3()).multiplyScalar(scale));
      // Lift model so its bottom sits on the floor (y=0)
      const scaledBox = new THREE.Box3().setFromObject(model);
      model.position.y -= scaledBox.min.y;

      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
          child.userData.originalMaterial = child.material;
        }
      });

      scene.add(model);
      currentModel = model;
      hideOverlay();
    },
    undefined,
    () => {
      /* GLB not found, use procedural fallback geometry */
      const model = buildFallbackModel(data);
      scene.add(model);
      currentModel = model;
      hideOverlay();
    }
  );
};

/**
 * Builds a procedural perfume bottle using Three.js geometry.
 * This runs automatically if the Blender GLB file is not present.
 *
 * The bottle has:
 *   - Body built with LatheGeometry (rotated curve profile)
 *   - Neck as a CylinderGeometry
 *   - Cap as a CylinderGeometry with dome
 *   - Flat label panel on the front
 *   - Glow ring at the base
 *
 * @param {Object} data - model entry from MODELS
 * @returns {THREE.Group}
 */
function buildFallbackModel(data) {
  const group = new THREE.Group();

  /* Bottle body - LatheGeometry from a 2D curve profile */
  const bodyPoints = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.80, 0.05),
    new THREE.Vector2(0.85, 0.10),
    new THREE.Vector2(0.90, 0.50),
    new THREE.Vector2(0.88, 1.20),
    new THREE.Vector2(0.85, 1.80),
    new THREE.Vector2(0.75, 2.10),
    new THREE.Vector2(0.50, 2.40),
    new THREE.Vector2(0.30, 2.60),
    new THREE.Vector2(0.25, 2.80),
  ];

  const body = new THREE.Mesh(
    new THREE.LatheGeometry(bodyPoints, 32),
    new THREE.MeshStandardMaterial({
      color: data.bodyColor, roughness: 0.05, metalness: 0.3,
      transparent: true, opacity: 0.88,
    })
  );
  body.castShadow = true;
  group.add(body);

  /* Neck */
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.26, 0.5, 24),
    new THREE.MeshStandardMaterial({ color: data.bodyColor, roughness: 0.08, metalness: 0.4 })
  );
  neck.position.y = 3.05;
  neck.castShadow = true;
  group.add(neck);

  /* Cap */
  const capMat = new THREE.MeshStandardMaterial({
    color: data.capColor, roughness: 0.08, metalness: 0.9,
  });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.24, 0.7, 24), capMat);
  cap.position.y = 3.65;
  cap.castShadow = true;
  group.add(cap);

  /* Dome on top of cap */
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.30, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    capMat
  );
  dome.position.y = 4.0;
  group.add(dome);

  /* Label panel */
  const labelGeo = new THREE.BoxGeometry(1.0, 1.2, 0.02);
  const label = new THREE.Mesh(labelGeo,
    new THREE.MeshStandardMaterial({ color: data.accent, roughness: 0.5 })
  );
  label.position.set(0, 1.2, 0.91);
  group.add(label);

  /* Gold border around label */
  const border = new THREE.LineSegments(
    new THREE.EdgesGeometry(labelGeo),
    new THREE.LineBasicMaterial({ color: data.capColor })
  );
  border.position.copy(label.position);
  group.add(border);

  /* Glow ring at base */
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.04, 8, 48),
    new THREE.MeshStandardMaterial({
      color: data.capColor, emissive: data.capColor,
      emissiveIntensity: 0.4, roughness: 0.2, metalness: 0.8,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  /* Store materials for wireframe toggle */
  group.traverse(child => {
    if (child.isMesh) child.userData.originalMaterial = child.material.clone();
  });

  return group;
}

/* ============================================================
   CONTENT SWAP
   ============================================================ */

/**
 * Updates the model info panel below the canvas.
 * Swaps the name, subtitle, description and scent note pills.
 *
 * @param {Object} data - model entry from MODELS
 */
function updateInfoPanel(data) {
  const nameEl  = document.getElementById('info-name');
  const subEl   = document.getElementById('info-subtitle');
  const descEl  = document.getElementById('info-desc');
  const notesEl = document.getElementById('info-notes');
  if (!nameEl) return;

  nameEl.textContent = data.name;
  subEl.textContent  = data.subtitle;
  descEl.textContent = data.desc;

  notesEl.innerHTML = '';
  data.notes.forEach(note => {
    const span = document.createElement('span');
    span.className   = 'scent-note';
    span.textContent = note;
    notesEl.appendChild(span);
  });
}

/* ============================================================
   INTERACTIVE CONTROLS
   ============================================================ */

/**
 * Triggered by the Animate button (onClick method as required by brief).
 * Plays a 360 degree spin with a scale pulse on the current model.
 */
window.triggerAnimation = function() {
  if (!currentModel || isAnimating) return;
  isAnimating = true;
  spinTarget  = currentModel.rotation.y + (Math.PI * 2);
  pulsePhase  = 0;
};

/**
 * Toggles wireframe mode on all meshes in the current model.
 * Required explicitly by the assignment brief.
 */
window.toggleWireframe = function() {
  isWireframe = !isWireframe;
  const btn = document.getElementById('btn-wire');
  if (btn) btn.classList.toggle('active-btn', isWireframe);
  if (!currentModel) return;

  currentModel.traverse(child => {
    if (!child.isMesh) return;
    if (isWireframe) {
      child.userData.savedMaterial = child.material;
      child.material = new THREE.MeshBasicMaterial({ color: 0x00aaff, wireframe: true });
    } else {
      if (child.userData.savedMaterial) child.material = child.userData.savedMaterial;
    }
  });
};

/**
 * Toggles the passive slow rotation of the model.
 */
window.toggleAutoRotate = function() {
  autoRotate = !autoRotate;
  const btn = document.getElementById('btn-rotate');
  if (btn) btn.classList.toggle('active-btn', autoRotate);
};

/**
 * Returns the camera to its starting position.
 */
window.resetCamera = function() {
  camera.position.set(0, 1.5, 7);
  controls.target.set(0, 0, 0);
  controls.update();
};

/* ============================================================
   AMBIENT AUDIO - HTML5 Audio with looping MP3
   ============================================================ */

/* ============================================================
   ANIMATION LOOP
   ============================================================ */

/**
 * Main render loop - runs at ~60fps via requestAnimationFrame.
 * Handles passive rotation, button-triggered spin, pulse scale,
 * animated spot light and the OrbitControls update.
 */
function animate() {
  requestAnimationFrame(animate);

  const delta   = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  if (currentModel) {
    /* Passive auto-rotation */
    if (autoRotate && !isAnimating) {
      currentModel.rotation.y += 0.004;
    }

    /* Spin animation triggered by Animate button */
    if (isAnimating) {
      const remaining = spinTarget - currentModel.rotation.y;
      if (Math.abs(remaining) > 0.01) {
        currentModel.rotation.y += remaining * 0.08;
      } else {
        currentModel.rotation.y = spinTarget;
        isAnimating = false;
      }

      /* Pulse scale during spin */
      pulsePhase += delta * 4;
      const pulse = 1 + 0.08 * Math.sin(pulsePhase);
      currentModel.scale.setScalar(pulse);
    } else {
      /* Ease scale back to 1 */
      currentModel.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  }

  /* Animated spot light when GUI toggle is on */
  if (guiParams && guiParams.spot.moving) {
    spotLight.position.x = Math.sin(elapsed * 0.8) * 5;
    if (spotHelper.visible) spotHelper.update();
  }

  controls.update();
  renderer.render(scene, camera);
}

/* ============================================================
   RESIZE HANDLER
   ============================================================ */

/**
 * Updates camera and renderer when the browser window resizes.
 */
function onResize() {
  camera.aspect = getContainerWidth() / getContainerHeight();
  camera.updateProjectionMatrix();
  renderer.setSize(getContainerWidth(), getContainerHeight());
}

function getContainerWidth() {
  const el = document.getElementById('threeContainer');
  return el ? el.clientWidth : window.innerWidth;
}

function getContainerHeight() {
  const el = document.getElementById('threeContainer');
  return el ? el.clientHeight : Math.floor(window.innerHeight * 0.7);
}

function getAspect() {
  return getContainerWidth() / getContainerHeight();
}

/* Start the app */
init();
