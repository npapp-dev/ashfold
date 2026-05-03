import * as THREE from 'three';
import type { GameTime } from '../game/state';

export function createLighting(scene: THREE.Scene) {
  const ambient = new THREE.AmbientLight(0x303034, 0.9);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x404050, 0x2a1818, 0.5);
  scene.add(hemi);

  const moon = new THREE.DirectionalLight(0x9aa0c0, 0.55);
  moon.position.set(5, 10, 3);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -10;
  moon.shadow.camera.right = 10;
  moon.shadow.camera.top = 10;
  moon.shadow.camera.bottom = -10;
  scene.add(moon);

  const brazier = new THREE.PointLight(0xff6622, 2, 16, 1.5);
  brazier.position.set(0, 1.4, 0);
  brazier.castShadow = true;
  scene.add(brazier);

  return {
    update(time: GameTime) {
      const isNight = time.hour < 6 || time.hour > 19;
      const flicker = (Math.random() - 0.5) * 0.6;
      brazier.intensity = isNight ? 3.6 + flicker : 1.4 + flicker * 0.3;
      moon.intensity = isNight ? 0.55 : 0.7;
      ambient.intensity = isNight ? 0.55 : 0.9;
      hemi.intensity = isNight ? 0.35 : 0.55;
    },
  };
}
