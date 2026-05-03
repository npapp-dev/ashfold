import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCompound } from './compound';
import { createFollowers } from './followers';
import { createLighting } from './lighting';
import { createPicking } from './picking';
import type { Follower, GameTime } from '../game/state';

export function createScene(
  root: HTMLElement,
  onPick: (id: string | null) => void,
) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  root.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0709);
  scene.fog = new THREE.Fog(0x0a0709, 18, 38);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(8, 10, 8);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.45;
  controls.minPolarAngle = Math.PI * 0.15;
  controls.minDistance = 5;
  controls.maxDistance = 20;
  controls.enablePan = false;
  controls.update();

  const compound = createCompound(scene);
  const lighting = createLighting(scene);
  const followers = createFollowers(scene);
  createPicking(renderer, scene, camera, onPick);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    render: () => {
      controls.update();
      compound.update();
      renderer.render(scene, camera);
    },
    syncFollowers: (list: Follower[], selectedId: string | null) =>
      followers.update(list, selectedId),
    syncTime: (time: GameTime) => lighting.update(time),
  };
}
