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

type AltarRefs = {
  pool: THREE.MeshStandardMaterial;
};

function createAltar(scene: THREE.Scene): AltarRefs {
  const stone = new THREE.MeshStandardMaterial({ color: 0x14101a, roughness: 0.95 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x080608, roughness: 0.45, metalness: 0.7 });
  const pool = new THREE.MeshStandardMaterial({
    color: 0x300808,
    emissive: 0xff1a08,
    emissiveIntensity: 1.6,
    roughness: 0.7,
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

  const poolMesh = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.6), pool);
  poolMesh.position.y = 1.07;
  scene.add(poolMesh);

  const cornerSpike = new THREE.ConeGeometry(0.13, 0.85, 6);
  for (const [x, z] of [
    [-0.9, -0.9],
    [0.9, -0.9],
    [-0.9, 0.9],
    [0.9, 0.9],
  ]) {
    const s = new THREE.Mesh(cornerSpike, iron);
    s.position.set(x, 1.03, z);
    s.castShadow = true;
    scene.add(s);
  }

  const tallSpike = new THREE.ConeGeometry(0.085, 1.6, 6);
  for (const z of [-0.55, 0.55]) {
    const s = new THREE.Mesh(tallSpike, iron);
    s.position.set(0, 1.86, z);
    s.castShadow = true;
    scene.add(s);
  }

  const horns = new THREE.ConeGeometry(0.06, 0.55, 6);
  for (const [x, z, ax] of [
    [-0.55, 0, 0.4],
    [0.55, 0, -0.4],
  ] as Array<[number, number, number]>) {
    const s = new THREE.Mesh(horns, iron);
    s.position.set(x, 1.32, z);
    s.rotation.z = ax;
    s.castShadow = true;
    scene.add(s);
  }

  return { pool };
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
      altar.pool.emissiveIntensity = 1.4 + Math.sin(t * 2.4) * 0.4;
    },
  };
}
