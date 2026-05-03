import {
  ASCEND_COST,
  avgSanity,
  canAscend,
  SUSPICION_THRESHOLD,
  type GameState,
  type Task,
} from '../game/state';
import { recruitCost } from '../game/actions';
import { doctrineName } from '../game/doctrines';

type HudHandlers = {
  onAssignTask: (followerId: string, task: Task) => void;
  onDeselect: () => void;
  onRecruit: () => void;
  onAscend: () => void;
  onReset: () => void;
};

const TASK_DESC: Record<Task, string> = {
  idle: 'Wandering. Slowly recovers sanity.',
  pray: 'At the ritual ring. +Faith and recovers sanity.',
  study: 'At the standing stones. +Forbidden, drains sanity sharply, raises Suspicion.',
  sacrifice:
    'Walks to the brazier. AT NIGHT, THEY DIE — leaving a body, +Faith, +Forbidden. All survivors lose sanity. Suspicion spikes.',
  broken: 'Mind shattered. Cannot work. Slowly recovering.',
};

const ASSIGNABLE_TASKS: Task[] = ['idle', 'pray', 'study', 'sacrifice'];

let timeEl: HTMLElement;
let doctrineEl: HTMLElement;
let resourceEl: HTMLElement;
let logEl: HTMLElement;
let detailEl: HTMLElement;
let recruitBtn: HTMLButtonElement;
let ascendBtn: HTMLButtonElement;
let ritualForbiddenFill: HTMLElement;
let ritualBodiesFill: HTMLElement;
let ritualFaithFill: HTMLElement;
let ritualForbiddenLabel: HTMLElement;
let ritualBodiesLabel: HTMLElement;
let ritualFaithLabel: HTMLElement;
let ritualOutcomeEl: HTMLElement;
let sanityFillEl: HTMLElement | null = null;
let sanityNumEl: HTMLElement | null = null;
let handlers: HudHandlers;
let lastDetailKey = '';

function sanityColor(s: number): string {
  if (s >= 60) return '#5a9050';
  if (s >= 30) return '#a08840';
  return '#a04040';
}

function suspicionColor(s: number): string {
  if (s < 20) return '#5a9050';
  if (s < 40) return '#a08840';
  return '#c04040';
}

type OutcomeName = 'apotheosis' | 'pyrrhic' | 'catastrophe' | 'unknown';

function predictOutcome(state: GameState): { name: OutcomeName; label: string; color: string } {
  const avg = avgSanity(state);
  if (avg === null) return { name: 'unknown', label: '— no fold —', color: '#6a5848' };
  if (avg >= 60) return { name: 'apotheosis', label: 'APOTHEOSIS awaits', color: '#f0d8a8' };
  if (avg >= 30) return { name: 'pyrrhic', label: 'PYRRHIC RISING', color: '#d0a890' };
  return { name: 'catastrophe', label: 'CATASTROPHE', color: '#a04848' };
}

export function mountHud(root: HTMLElement, h: HudHandlers): void {
  handlers = h;

  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <div class="panel top-left">
      <div id="time" class="time"></div>
      <div id="doctrine" class="doctrine-line"></div>
      <div id="resources" class="resources"></div>
      <button class="action-btn" id="recruit-btn"></button>

      <div class="ritual-section">
        <div class="ritual-title">The Final Ritual</div>
        <div class="ritual-row">
          <span>Forbidden</span>
          <div class="ritual-track"><div class="ritual-fill" id="r-forbidden-fill"></div></div>
          <b id="r-forbidden-label"></b>
        </div>
        <div class="ritual-row">
          <span>Bodies</span>
          <div class="ritual-track"><div class="ritual-fill" id="r-bodies-fill"></div></div>
          <b id="r-bodies-label"></b>
        </div>
        <div class="ritual-row">
          <span>Faith</span>
          <div class="ritual-track"><div class="ritual-fill" id="r-faith-fill"></div></div>
          <b id="r-faith-label"></b>
        </div>
        <div class="ritual-outcome" id="r-outcome"></div>
        <button class="action-btn ascend-btn" id="ascend-btn"></button>
      </div>

      <button class="reset-btn" id="reset-btn">Begin Anew</button>
    </div>
    <div class="panel top-right" id="detail" hidden></div>
    <div class="panel bottom-left">
      <div id="log" class="log"></div>
    </div>
  `;
  root.appendChild(hud);

  timeEl = document.getElementById('time')!;
  doctrineEl = document.getElementById('doctrine')!;
  resourceEl = document.getElementById('resources')!;
  logEl = document.getElementById('log')!;
  detailEl = document.getElementById('detail')!;
  recruitBtn = document.getElementById('recruit-btn') as HTMLButtonElement;
  ascendBtn = document.getElementById('ascend-btn') as HTMLButtonElement;
  ritualForbiddenFill = document.getElementById('r-forbidden-fill')!;
  ritualBodiesFill = document.getElementById('r-bodies-fill')!;
  ritualFaithFill = document.getElementById('r-faith-fill')!;
  ritualForbiddenLabel = document.getElementById('r-forbidden-label')!;
  ritualBodiesLabel = document.getElementById('r-bodies-label')!;
  ritualFaithLabel = document.getElementById('r-faith-label')!;
  ritualOutcomeEl = document.getElementById('r-outcome')!;

  recruitBtn.addEventListener('click', () => handlers.onRecruit());
  ascendBtn.addEventListener('click', () => {
    if (
      confirm(
        'Begin the final ritual? It will consume 100 Forbidden, 5 Bodies, and 50 Faith. The fold’s sanity decides the outcome.',
      )
    ) {
      handlers.onAscend();
    }
  });
  document.getElementById('reset-btn')!.addEventListener('click', () => {
    if (confirm('Begin anew? The current fold will be unmade.')) {
      handlers.onReset();
    }
  });
}

function updateRitual(state: GameState) {
  const r = state.resources;
  const fPct = Math.min(100, (r.forbidden / ASCEND_COST.forbidden) * 100);
  const bPct = Math.min(100, (r.bodies / ASCEND_COST.bodies) * 100);
  const faPct = Math.min(100, (r.faith / ASCEND_COST.faith) * 100);

  ritualForbiddenFill.style.width = `${fPct.toFixed(1)}%`;
  ritualBodiesFill.style.width = `${bPct.toFixed(1)}%`;
  ritualFaithFill.style.width = `${faPct.toFixed(1)}%`;

  ritualForbiddenFill.classList.toggle('complete', fPct >= 100);
  ritualBodiesFill.classList.toggle('complete', bPct >= 100);
  ritualFaithFill.classList.toggle('complete', faPct >= 100);

  ritualForbiddenLabel.textContent = `${r.forbidden.toFixed(0)}/${ASCEND_COST.forbidden}`;
  ritualBodiesLabel.textContent = `${r.bodies}/${ASCEND_COST.bodies}`;
  ritualFaithLabel.textContent = `${r.faith.toFixed(0)}/${ASCEND_COST.faith}`;

  const outcome = predictOutcome(state);
  ritualOutcomeEl.textContent = canAscend(state)
    ? `→ ${outcome.label}`
    : `Will yield: ${outcome.label}`;
  ritualOutcomeEl.style.color = outcome.color;
}

export function updateHud(state: GameState): void {
  const h = Math.floor(state.time.hour);
  const m = Math.floor((state.time.hour - h) * 60);
  timeEl.textContent = `Day ${state.time.day} — ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  doctrineEl.textContent = doctrineName(state.doctrine);

  const counts = { idle: 0, pray: 0, study: 0, sacrifice: 0, broken: 0 };
  for (const f of state.followers) counts[f.task]++;

  const r = state.resources;
  const avg = avgSanity(state);
  const avgDisplay = avg === null ? '—' : avg.toFixed(0);
  const suspicionPct = Math.min(100, (state.suspicion / SUSPICION_THRESHOLD) * 100);
  resourceEl.innerHTML = `
    <div><span>Faith</span><b>${r.faith.toFixed(0)}</b></div>
    <div><span>Sanity (avg)</span><b style="color:${avg === null ? '#c8b8a8' : sanityColor(avg)}">${avgDisplay}</b></div>
    <div><span>Forbidden</span><b>${r.forbidden.toFixed(0)}</b></div>
    <div><span>Bodies</span><b>${r.bodies}</b></div>
    <div><span>Suspicion</span><b style="color:${suspicionColor(state.suspicion)}">${state.suspicion.toFixed(0)}/${SUSPICION_THRESHOLD}</b></div>
    <div class="suspicion-bar"><div class="suspicion-fill" style="width:${suspicionPct.toFixed(1)}%; background:${suspicionColor(state.suspicion)}"></div></div>
    <div class="divider"></div>
    <div><span>Followers</span><b>${state.followers.length}</b></div>
    <div class="task-breakdown">
      ${counts.idle ? `<span>${counts.idle} idle</span>` : ''}
      ${counts.pray ? `<span class="t-pray">${counts.pray} praying</span>` : ''}
      ${counts.study ? `<span class="t-study">${counts.study} studying</span>` : ''}
      ${counts.sacrifice ? `<span class="t-sacrifice">${counts.sacrifice} ritual</span>` : ''}
      ${counts.broken ? `<span class="t-broken">${counts.broken} broken</span>` : ''}
    </div>
  `;

  const cost = recruitCost(state);
  recruitBtn.disabled = r.faith < cost || state.status !== 'playing';
  recruitBtn.textContent = `Recruit — ${cost} Faith`;

  ascendBtn.disabled = !canAscend(state);
  ascendBtn.textContent = canAscend(state) ? 'Begin the Ritual' : 'Not Yet Ready';

  updateRitual(state);

  logEl.innerHTML = state.log.slice(-5).map((l) => `<div>${l}</div>`).join('');

  const selected = state.selectedFollowerId
    ? state.followers.find((f) => f.id === state.selectedFollowerId) ?? null
    : null;

  const key = selected ? `${selected.id}:${selected.task}:${state.status}` : '';
  if (key !== lastDetailKey) {
    lastDetailKey = key;

    if (!selected) {
      detailEl.hidden = true;
      detailEl.innerHTML = '';
      sanityFillEl = null;
      sanityNumEl = null;
    } else {
      detailEl.hidden = false;
      const isBroken = selected.task === 'broken';
      const disabledAttr = state.status !== 'playing' || isBroken ? 'disabled' : '';
      detailEl.innerHTML = `
        <div class="time">${selected.name}</div>
        <div class="sanity-row">
          <span>Sanity</span>
          <div class="sanity-track">
            <div class="sanity-fill" id="sanity-fill"></div>
          </div>
          <b id="sanity-num"></b>
        </div>
        <div class="follower-task">currently: <b>${selected.task}</b></div>
        <div class="task-desc ${selected.task === 'sacrifice' ? 'task-desc-warn' : ''}">${TASK_DESC[selected.task]}</div>
        <div class="task-buttons">
          ${ASSIGNABLE_TASKS.map(
            (t) =>
              `<button data-task="${t}" ${disabledAttr} class="${selected.task === t ? 'active' : ''} ${t === 'sacrifice' ? 'btn-danger' : ''}">${t}</button>`,
          ).join('')}
        </div>
        ${isBroken ? '<div class="broken-msg">Their mind is shattered. They will not work until it heals.</div>' : ''}
        <button class="deselect-btn" id="deselect-btn">Deselect</button>
      `;

      sanityFillEl = document.getElementById('sanity-fill');
      sanityNumEl = document.getElementById('sanity-num');

      detailEl.querySelectorAll<HTMLButtonElement>('button[data-task]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const task = btn.dataset.task as Task;
          if (task === 'sacrifice') {
            if (!confirm(`Send ${selected.name} to the brazier? They will not return.`)) {
              return;
            }
          }
          handlers.onAssignTask(selected.id, task);
        });
      });
      document.getElementById('deselect-btn')!.addEventListener('click', () => {
        handlers.onDeselect();
      });
    }
  }

  if (selected && sanityFillEl && sanityNumEl) {
    const s = Math.max(0, Math.min(100, selected.sanity));
    sanityFillEl.style.width = `${s.toFixed(1)}%`;
    sanityFillEl.style.background = sanityColor(s);
    sanityNumEl.textContent = s.toFixed(0);
    sanityNumEl.style.color = sanityColor(s);
  }
}
