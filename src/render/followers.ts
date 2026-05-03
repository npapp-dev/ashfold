import * as THREE from 'three';
import type { Follower, Task } from '../game/state';

const SELECTION_RING_GEOM = (() => {
  const g = new THREE.RingGeometry(0.32, 0.42, 32);
  g.rotateX(-Math.PI / 2);
  return g;
})();

const TASK_COLORS: Record<Task, THREE.Color> = {
  idle: new THREE.Color(0x8a6850),
  pray: new THREE.Color(0xd4b020),
  study: new THREE.Color(0x4060a8),
  sacrifice: new THREE.Color(0xc03830),
  broken: new THREE.Color(0x1c2418),
};

const HEAD_COLOR = new THREE.Color(0xe8d4ba);
const BROKEN_HEAD = new THREE.Color(0xb8b8a0);

function makeFollowerMesh(id: string): THREE.Group {
  const outer = new THREE.Group();
  outer.userData.followerId = id;

  const inner = new THREE.Group();
  outer.add(inner);

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.18, 0.5, 4, 8),
    new THREE.MeshStandardMaterial({ color: TASK_COLORS.idle.getHex(), roughness: 0.9 }),
  );
  body.position.y = 0.45;
  body.castShadow = true;
  body.userData.followerId = id;
  inner.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 10),
    new THREE.MeshStandardMaterial({ color: HEAD_COLOR.getHex(), roughness: 0.85 }),
  );
  head.position.y = 0.92;
  head.castShadow = true;
  head.userData.followerId = id;
  inner.add(head);

  const ring = new THREE.Mesh(
    SELECTION_RING_GEOM,
    new THREE.MeshBasicMaterial({ color: 0xff7733, transparent: true, opacity: 0.85 }),
  );
  ring.position.y = 0.02;
  ring.visible = false;
  outer.add(ring);

  outer.userData.ring = ring;
  outer.userData.inner = inner;

  return outer;
}

export function createFollowers(scene: THREE.Scene) {
  const meshes = new Map<string, THREE.Group>();

  return {
    update(followers: Follower[], selectedId: string | null) {
      const seen = new Set<string>();
      for (const f of followers) {
        seen.add(f.id);
        let m = meshes.get(f.id);
        if (!m) {
          m = makeFollowerMesh(f.id);
          scene.add(m);
          meshes.set(f.id, m);
        }
        m.position.x = f.x;
        m.position.z = f.z;

        const dx = f.targetX - f.x;
        const dz = f.targetZ - f.z;
        if (dx * dx + dz * dz > 0.01) {
          m.rotation.y = Math.atan2(dx, dz);
        }

        const inner = m.userData.inner as THREE.Group;
        const sanityRatio = Math.max(0, Math.min(1, f.sanity / 100));
        inner.rotation.z = (1 - sanityRatio) * 0.45;

        const body = inner.children[0] as THREE.Mesh;
        const bodyMat = body.material as THREE.MeshStandardMaterial;
        const head = inner.children[1] as THREE.Mesh;
        const headMat = head.material as THREE.MeshStandardMaterial;

        bodyMat.color.copy(TASK_COLORS[f.task]);
        headMat.color.copy(f.task === 'broken' ? BROKEN_HEAD : HEAD_COLOR);

        const ring = m.userData.ring as THREE.Mesh;
        ring.visible = f.id === selectedId;
      }
      for (const [id, m] of meshes) {
        if (!seen.has(id)) {
          scene.remove(m);
          meshes.delete(id);
        }
      }
    },
  };
}
