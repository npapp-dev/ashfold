import * as THREE from 'three';

const NUM_RUNES = 12;
const RUNE_RADIUS = 2.85;
const RUNE_SIZE = 0.42;
const COMPOUND_GROUND_RADIUS = 8;
const STANDING_STONE_RADIUS = 5;
const NUM_STANDING_STONES = 8;

function makeRuneTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = size * 0.085;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const variant = Math.floor(Math.random() * 4);

  if (variant === 0) {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.lineTo(pts[4][0], pts[4][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[3][0], pts[3][1]);
    ctx.closePath();
    ctx.stroke();
  } else if (variant === 1) {
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r * 0.55);
    ctx.lineTo(cx + r, cy - r * 0.55);
    ctx.lineTo(cx, cy + r);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy);
    ctx.lineTo(cx + r * 0.6, cy);
    ctx.stroke();
  } else if (variant === 2) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.moveTo(cx - r * 0.5, cy + r * 0.35);
    ctx.lineTo(cx + r * 0.5, cy + r * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.9, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const strokes = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < strokes; i++) {
      const a1 = Math.random() * Math.PI * 2;
      const a2 = a1 + (Math.random() - 0.4) * Math.PI;
      const r1 = (0.5 + Math.random() * 0.5) * r;
      const r2 = (0.5 + Math.random() * 0.5) * r;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1);
      ctx.lineTo(cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function makeSigilTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = w / 2;
  const cy = h / 2;
  const r = h * 0.38;
  const variant = Math.floor(Math.random() * 4);

  if (variant === 0) {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 5; i++) {
      const a = Math.PI / 2 + (i / 5) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.lineTo(pts[4][0], pts[4][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[3][0], pts[3][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
    ctx.stroke();
  } else if (variant === 1) {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.9, cy - r * 0.6);
    ctx.lineTo(cx + r * 0.9, cy - r * 0.6);
    ctx.lineTo(cx, cy + r);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, cy);
    ctx.lineTo(cx + r * 0.55, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.35, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant === 2) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.moveTo(cx - r * 0.55, cy + r * 0.45);
    ctx.lineTo(cx + r * 0.55, cy + r * 0.45);
    ctx.moveTo(cx - r * 0.3, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.3, cy - r * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - r * 1.1, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.2, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.6, cy - r * 0.2);
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

type AltarRefs = {
  pool: THREE.MeshStandardMaterial;
  eye: THREE.MeshStandardMaterial;
  sigils: THREE.MeshBasicMaterial[];
  drip: THREE.MeshBasicMaterial;
};

function createAltar(scene: THREE.Scene): AltarRefs {
  const stone = new THREE.MeshStandardMaterial({ color: 0x14101a, roughness: 0.95 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x080608, roughness: 0.45, metalness: 0.7 });
  const pool = new THREE.MeshStandardMaterial({
    color: 0x300808,
    emissive: 0xff1a08,
    emissiveIntensity: 2.4,
    roughness: 0.65,
  });
  const eye = new THREE.MeshStandardMaterial({
    color: 0x080000,
    emissive: 0xff1a08,
    emissiveIntensity: 3.5,
    roughness: 0.35,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 1.9), stone);
  base.position.y = 0.3;
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  const mid = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 1.5), stone);
  mid.position.y = 0.74;
  mid.castShadow = true;
  scene.add(mid);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.18, 0.85), stone);
  slab.position.y = 0.97;
  slab.castShadow = true;
  scene.add(slab);

  const poolMesh = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.7), pool);
  poolMesh.position.y = 1.08;
  scene.add(poolMesh);

  const sigils: THREE.MeshBasicMaterial[] = [];
  const sigilSides = [
    { x: 0, z: 0.961, rotY: 0 },
    { x: 0, z: -0.961, rotY: Math.PI },
    { x: 0.961, z: 0, rotY: Math.PI / 2 },
    { x: -0.961, z: 0, rotY: -Math.PI / 2 },
  ];
  for (const s of sigilSides) {
    const mat = new THREE.MeshBasicMaterial({
      map: makeSigilTexture(),
      color: 0xff3818,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    sigils.push(mat);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.5), mat);
    plane.position.set(s.x, 0.32, s.z);
    plane.rotation.y = s.rotY;
    scene.add(plane);
  }

  const drip = new THREE.MeshBasicMaterial({
    color: 0xc01818,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const dripPositions: Array<[number, number]> = [
    [-0.78, 0.16],
    [-0.42, 0.34],
    [-0.12, 0.22],
    [0.18, 0.4],
    [0.5, 0.27],
    [0.82, 0.18],
  ];
  for (const [x, len] of dripPositions) {
    const dripMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.045, len), drip);
    dripMesh.position.set(x, 0.6 - len / 2, 0.972);
    scene.add(dripMesh);
  }

  const eyeGeom = new THREE.SphereGeometry(0.075, 16, 12);
  for (const x of [-0.22, 0.22]) {
    const e = new THREE.Mesh(eyeGeom, eye);
    e.position.set(x, 1.42, 0.05);
    scene.add(e);
  }

  const cornerSpikeGeom = new THREE.ConeGeometry(0.14, 1.1, 6);
  for (const [x, z] of [
    [-0.9, -0.9],
    [0.9, -0.9],
    [-0.9, 0.9],
    [0.9, 0.9],
  ]) {
    const s = new THREE.Mesh(cornerSpikeGeom, iron);
    s.position.set(x, 1.15, z);
    s.rotation.set(Math.sign(z) * 0.12, 0, -Math.sign(x) * 0.12);
    s.castShadow = true;
    scene.add(s);
  }

  const tallSpikeGeom = new THREE.ConeGeometry(0.09, 2.0, 6);
  for (const z of [-0.55, 0.55]) {
    const s = new THREE.Mesh(tallSpikeGeom, iron);
    s.position.set(0, 2.0, z);
    s.castShadow = true;
    scene.add(s);
  }

  return { pool, eye, sigils, drip };
}

export function createCompound(scene: THREE.Scene) {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(COMPOUND_GROUND_RADIUS, 64),
    new THREE.MeshStandardMaterial({ color: 0x1a1416, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 2.55, 64),
    new THREE.MeshBasicMaterial({ color: 0x4a0808, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.011;
  scene.add(ring);

  const runeMaterials: THREE.MeshBasicMaterial[] = [];
  for (let i = 0; i < NUM_RUNES; i++) {
    const a = (i / NUM_RUNES) * Math.PI * 2;
    const mat = new THREE.MeshBasicMaterial({
      map: makeRuneTexture(),
      color: 0xff4a18,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    runeMaterials.push(mat);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(RUNE_SIZE, RUNE_SIZE), mat);
    plane.rotation.set(-Math.PI / 2, 0, -a);
    plane.position.set(Math.cos(a) * RUNE_RADIUS, 0.013, Math.sin(a) * RUNE_RADIUS);
    scene.add(plane);
  }

  for (let i = 0; i < NUM_STANDING_STONES; i++) {
    const a = (i / NUM_STANDING_STONES) * Math.PI * 2;
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 1.2 + Math.random() * 0.4, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x222024, roughness: 1 }),
    );
    stone.position.set(
      Math.cos(a) * STANDING_STONE_RADIUS,
      0.6,
      Math.sin(a) * STANDING_STONE_RADIUS,
    );
    stone.rotation.y = a + (Math.random() - 0.5) * 0.4;
    stone.castShadow = true;
    stone.receiveShadow = true;
    scene.add(stone);
  }

  const altar = createAltar(scene);

  return {
    update() {
      const t = performance.now() / 1000;

      for (let i = 0; i < runeMaterials.length; i++) {
        const phase = i * 0.45;
        runeMaterials[i].opacity = 0.75 + Math.sin(t * 1.6 + phase) * 0.25;
      }

      altar.pool.emissiveIntensity =
        2.0 + Math.sin(t * 2.4) * 0.7 + Math.sin(t * 7.3) * 0.15;

      const blinkPhase = (t * 0.27) % 1;
      const blink = blinkPhase < 0.05 ? (1 - blinkPhase / 0.05) * 3 : 0;
      altar.eye.emissiveIntensity = Math.max(
        0.3,
        3.4 + Math.sin(t * 1.1) * 0.5 - blink,
      );

      for (let i = 0; i < altar.sigils.length; i++) {
        const phase = i * 0.7 + 1.2;
        altar.sigils[i].opacity = 0.55 + Math.sin(t * 1.2 + phase) * 0.3;
      }

      altar.drip.opacity = 0.82 + Math.sin(t * 0.9) * 0.1;
    },
  };
}
