import { createScene } from './render/scene';
import * as store from './game/store';
import { initialState } from './game/state';
import { tick } from './game/tick';
import { mountHud, updateHud } from './ui/hud';
import { syncOverlays } from './ui/overlays';
import { saveState, loadState, clearSave } from './game/save';
import {
  ascend,
  assignTask,
  fightInvestigator,
  payInvestigator,
  pickDoctrine,
  recruitFollower,
  selectFollower,
} from './game/actions';

const root = document.getElementById('app')!;

const saved = loadState();
if (saved) store.setState(saved);

const view = createScene(root, (id) => {
  store.update((s) => selectFollower(s, id));
});

mountHud(root, {
  onAssignTask: (id, task) => store.update((s) => assignTask(s, id, task)),
  onDeselect: () => store.update((s) => selectFollower(s, null)),
  onRecruit: () => store.update(recruitFollower),
  onAscend: () => store.update(ascend),
  onReset: () => {
    clearSave();
    store.setState(initialState());
  },
});

const overlayHandlers = {
  onPickDoctrine: (d: Parameters<typeof pickDoctrine>[1]) =>
    store.update((s) => pickDoctrine(s, d)),
  onPayInvestigator: () => store.update(payInvestigator),
  onFightInvestigator: () => store.update(fightInvestigator),
  onReset: () => {
    clearSave();
    store.setState(initialState());
  },
};

let last = performance.now();
let saveTimer = 0;

function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  store.update((s) => tick(s, dt));
  const state = store.getState();
  view.syncFollowers(state.followers, state.selectedFollowerId);
  view.syncTime(state.time);
  updateHud(state);
  syncOverlays(state, overlayHandlers);
  view.render();

  saveTimer += dt;
  if (saveTimer > 2) {
    saveTimer = 0;
    saveState(state);
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
