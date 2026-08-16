/* ============================================================
   ZOE LIFE — WebGL stage
   A beveled gold cross, a halo, and drifting light motes on a
   fixed canvas behind the page. Scroll pose comes from
   window.ZOE.scroll (set by js/main.js ScrollTriggers).
   ============================================================ */
import * as THREE from '../vendor/three.module.min.js';

const canvas = document.getElementById('gl');
if (canvas) init(canvas);

function init(canvas) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  /* ----- warm procedural environment (no external HDRI) ----- */
  scene.environment = makeEnvTexture();

  /* ----- lights ----- */
  scene.add(new THREE.HemisphereLight(0xffe9c4, 0x120d08, 0.5));
  const key = new THREE.DirectionalLight(0xffe0b0, 1.6);
  key.position.set(3.5, 4.5, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xe3b93e, 14, 30);
  rim.position.set(-5, -2, -4);
  scene.add(rim);

  /* ----- the cross ----- */
  const cross = new THREE.Group();
  scene.add(cross);

  const crossGeo = makeCrossGeometry();
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xcda637,
    metalness: 0.94,
    roughness: 0.22,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.15
  });
  const crossMesh = new THREE.Mesh(crossGeo, goldMat);
  cross.add(crossMesh);

  /* halo rings behind the cross — bloom in during the verse */
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xe8c877, transparent: true, opacity: 0 });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.02, 12, 160), haloMat);
  halo.position.z = -0.7;
  cross.add(halo);
  const haloMat2 = haloMat.clone();
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.008, 12, 160), haloMat2);
  halo2.position.z = -1.0;
  cross.add(halo2);

  /* soft glow sprite behind everything, rides with the cross */
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(), color: 0xd9a63c, transparent: true,
    opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  glow.scale.setScalar(11);
  glow.position.z = -2.5;
  cross.add(glow);

  /* ----- floating accents ----- */
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xb08a2e, metalness: 0.85, roughness: 0.35,
    envMapIntensity: 0.9, flatShading: true
  });
  const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), accentMat);
  ico.position.set(-3.4, 1.9, -2.2);
  scene.add(ico);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.15, 24, 64), accentMat);
  ring.position.set(3.6, -2.0, -1.8);
  scene.add(ring);

  /* ----- light motes ----- */
  const motes = makeMotes(coarse ? 260 : 650);
  scene.add(motes);

  /* ----- pose blending driven by scroll ----- */
  const state = () => (window.ZOE && window.ZOE.scroll) || { hero: 0, verseIn: 0, verseOut: 0 };
  const portrait = () => window.innerWidth < window.innerHeight || window.innerWidth < 901;

  function basePose() {
    return portrait()
      ? { x: 0, y: 1.85, s: 0.58, camZ: 8.6 }
      : { x: 1.6, y: -0.05, s: 1, camZ: 8 };
  }
  const ease = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;

  function currentPose() {
    const { hero, verseIn, verseOut } = state();
    const b = basePose();
    const h = ease(hero), v = ease(verseIn), w = ease(verseOut);
    // hero → scrolled away
    let x = b.x * (1 - h);
    let y = mix(b.y, b.y + 2.1, h);
    let s = b.s * (1 - 0.5 * h);
    let halo = 0;
    let camZ = b.camZ + 1.2 * h;
    // → verse pose (front and center, haloed)
    x = mix(x, 0, v);
    y = mix(y, 0, v);
    s = mix(s, portrait() ? 0.62 : 0.85, v);
    halo = mix(halo, 0.9, v);
    camZ = mix(camZ, 9, v);
    // → drifts down past the verse
    y = mix(y, -2.6, w);
    s = mix(s, 0.4, w);
    halo = mix(halo, 0, w);
    camZ = mix(camZ, 10.5, w);
    return { x, y, s, halo, camZ, spinExtra: (h * 1.75 + v * 1.0 + w * 1.0) * Math.PI };
  }

  /* ----- mouse parallax ----- */
  let mx = 0, my = 0;
  if (!coarse) {
    window.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  /* ----- resize ----- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });

  /* ----- frame loop ----- */
  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    const p = currentPose();

    cross.position.x += (p.x - cross.position.x) * 0.08;
    cross.position.y += (p.y - cross.position.y) * 0.08;
    const sc = cross.scale.x + (p.s - cross.scale.x) * 0.08;
    cross.scale.setScalar(sc);

    crossMesh.rotation.y = t * 0.35 + p.spinExtra;
    crossMesh.rotation.z = -0.05 + Math.sin(t * 0.4) * 0.04;
    crossMesh.rotation.x = Math.sin(t * 0.3) * 0.05;
    crossMesh.position.y = Math.sin(t * 0.8) * 0.07;

    halo.rotation.z = t * 0.12;
    halo2.rotation.z = -t * 0.08;
    haloMat.opacity += (p.halo - haloMat.opacity) * 0.07;
    haloMat2.opacity = haloMat.opacity * 0.55;
    glow.material.opacity = 0.32 + haloMat.opacity * 0.35;

    ico.rotation.x = t * 0.21; ico.rotation.y = t * 0.16;
    ico.position.y = 1.9 + Math.sin(t * 0.7) * 0.18;
    ring.rotation.x = 0.9 + t * 0.14; ring.rotation.y = t * 0.19;
    ring.position.y = -2.0 + Math.sin(t * 0.6 + 2) * 0.2;

    motes.rotation.y = t * 0.02 + state().hero * 0.5;
    motes.position.y = -state().hero * 1.4;

    camera.position.x += (mx * 0.55 - camera.position.x) * 0.045;
    camera.position.y += (-my * 0.4 - camera.position.y) * 0.045;
    camera.position.z += (p.camZ - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  if (reduced) {
    /* one calm, static frame — no motion */
    const b = basePose();
    cross.position.set(b.x, b.y, 0);
    cross.scale.setScalar(b.s);
    crossMesh.rotation.set(0.05, 0.6, -0.05);
    camera.position.z = b.camZ;
    renderer.render(scene, camera);
  } else {
    renderer.setAnimationLoop(frame);
  }

  /* ================= helpers ================= */

  function makeCrossGeometry() {
    // latin cross, centered on the crossbar
    const w = 0.26;   // half beam width
    const hx = 1.02;  // arm half-span
    const ty = 0.92;  // top height
    const by = 1.52;  // bottom drop
    const s = new THREE.Shape();
    s.moveTo(-w, ty);
    s.lineTo(w, ty);
    s.lineTo(w, w);
    s.lineTo(hx, w);
    s.lineTo(hx, -w);
    s.lineTo(w, -w);
    s.lineTo(w, -by);
    s.lineTo(-w, -by);
    s.lineTo(-w, -w);
    s.lineTo(-hx, -w);
    s.lineTo(-hx, w);
    s.lineTo(-w, w);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.36, steps: 1,
      bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.055, bevelSegments: 5
    });
    geo.center();
    return geo;
  }

  function makeEnvTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#241505');
    grad.addColorStop(0.42, '#8a5a1c');
    grad.addColorStop(0.55, '#f0c25e');
    grad.addColorStop(0.62, '#7c4d16');
    grad.addColorStop(1, '#0d0805');
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 256);
    // bright streaks so the metal has something interesting to mirror
    g.globalAlpha = 0.85;
    [[60, 60, 130, 10], [300, 40, 90, 8], [420, 90, 70, 14], [180, 150, 160, 9], [40, 190, 110, 7]]
      .forEach(([x, y, w2, h2]) => {
        const r = g.createLinearGradient(x, y, x + w2, y);
        r.addColorStop(0, 'rgba(255,240,200,0)');
        r.addColorStop(0.5, 'rgba(255,240,200,0.95)');
        r.addColorStop(1, 'rgba(255,240,200,0)');
        g.fillStyle = r;
        g.fillRect(x, y, w2, h2);
      });
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeGlowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,225,150,1)');
    grad.addColorStop(0.35, 'rgba(255,200,110,0.35)');
    grad.addColorStop(1, 'rgba(255,200,110,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function makeMotes(count) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // hollow-ish shell so motes don't crowd the cross
      const r = 3.5 + Math.random() * 11;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = -2 - Math.random() * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.055, map: makeGlowTexture(), color: 0xe8c877,
      transparent: true, opacity: 0.65, depthWrite: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    return new THREE.Points(geo, mat);
  }
}
