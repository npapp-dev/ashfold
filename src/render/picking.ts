import * as THREE from 'three';

export function createPicking(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  onPick: (followerId: string | null) => void,
): void {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const dom = renderer.domElement;
  let downX = 0;
  let downY = 0;

  dom.addEventListener('pointerdown', (e) => {
    downX = e.clientX;
    downY = e.clientY;
  });

  dom.addEventListener('pointerup', (e) => {
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (moved > 4) return;

    const rect = dom.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);

    const pickables: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.userData.followerId) pickables.push(obj);
    });

    const hits = raycaster.intersectObjects(pickables, true);
    if (hits.length === 0) {
      onPick(null);
      return;
    }
    let target: THREE.Object3D | null = hits[0].object;
    while (target && !target.userData.followerId) target = target.parent;
    onPick(target ? (target.userData.followerId as string) : null);
  });
}
