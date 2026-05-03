import { DOCTRINES, type Doctrine, doctrineName } from '../game/doctrines';
import { raidCost } from '../game/actions';
import { isEndgame, type GameState, type GameStatus } from '../game/state';

type OverlayHandlers = {
  onPickDoctrine: (d: Doctrine) => void;
  onPayInvestigator: () => void;
  onFightInvestigator: () => void;
  onReset: () => void;
};

type OverlayKind = 'none' | 'doctrine' | 'investigation' | 'outcome';

let currentKind: OverlayKind = 'none';
let currentEl: HTMLElement | null = null;
let lastStatus: GameStatus | '' = '';

const OUTCOME_TITLES: Record<string, string> = {
  'won-apotheosis': 'APOTHEOSIS',
  'won-pyrrhic': 'A PYRRHIC RISING',
  'lost-catastrophe': 'CATASTROPHE',
  'lost-empty': 'THE FOLD IS NO MORE',
};

const OUTCOME_TEXTS: Record<string, string> = {
  'won-apotheosis':
    'Your god awakens. The world is remade in its image. The fold becomes the dawn.',
  'won-pyrrhic':
    'The god rises, but the fold burns with it. None remember the dawn — only the price.',
  'lost-catastrophe':
    'The thing that answered was not what you summoned. The compound is silent now.',
  'lost-empty': 'No one remains. The brazier dies. The runes fade.',
};

function statusToKind(status: GameStatus): OverlayKind {
  if (status === 'doctrine-pick') return 'doctrine';
  if (status === 'investigation') return 'investigation';
  if (isEndgame(status)) return 'outcome';
  return 'none';
}

function clearOverlay() {
  if (currentEl) {
    currentEl.remove();
    currentEl = null;
  }
  currentKind = 'none';
}

function mountDoctrine(handlers: OverlayHandlers) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay doctrine-overlay';
  overlay.innerHTML = `
    <div class="overlay-title">Choose Your Doctrine</div>
    <div class="overlay-subtitle">Each path shapes what the fold becomes.</div>
    <div class="doctrine-cards">
      ${(Object.keys(DOCTRINES) as Doctrine[])
        .map(
          (key) => `
        <div class="doctrine-card" data-doctrine="${key}">
          <div class="doctrine-name">${DOCTRINES[key].name}</div>
          <div class="doctrine-tagline">${DOCTRINES[key].tagline}</div>
          <div class="doctrine-desc">${DOCTRINES[key].description}</div>
        </div>
      `,
        )
        .join('')}
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelectorAll<HTMLElement>('.doctrine-card').forEach((card) => {
    card.addEventListener('click', () => {
      const d = card.dataset.doctrine as Doctrine;
      handlers.onPickDoctrine(d);
    });
  });
  return overlay;
}

function mountInvestigation(state: GameState, handlers: OverlayHandlers) {
  const cost = raidCost(state);
  const canPay = state.resources.faith >= cost;
  const overlay = document.createElement('div');
  overlay.className = 'overlay modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-title">An Investigator at the Gate</div>
      <div class="modal-text">
        A figure has come asking questions. Their eyes catch on the runes. They will leave for a price.
      </div>
      <div class="modal-buttons">
        <button id="pay-btn" ${canPay ? '' : 'disabled'}>Pay ${cost} Faith</button>
        <button id="fight-btn">Refuse</button>
      </div>
      <div class="modal-hint">Refusing risks the fold. The hunter takes what they came for.</div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('pay-btn')!.addEventListener('click', handlers.onPayInvestigator);
  document.getElementById('fight-btn')!.addEventListener('click', handlers.onFightInvestigator);
  return overlay;
}

function mountOutcome(state: GameState, handlers: OverlayHandlers) {
  const status = state.status as keyof typeof OUTCOME_TITLES;
  const overlay = document.createElement('div');
  overlay.className = `overlay outcome-overlay outcome-${state.status}`;
  overlay.innerHTML = `
    <div class="outcome-content">
      <div class="outcome-title">${OUTCOME_TITLES[status] ?? 'THE END'}</div>
      <div class="outcome-text">${OUTCOME_TEXTS[status] ?? ''}</div>
      <div class="outcome-stats">
        <div><span>Days endured</span><b>${state.time.day}</b></div>
        <div><span>Followers at end</span><b>${state.followers.length}</b></div>
        <div><span>Doctrine</span><b>${doctrineName(state.doctrine)}</b></div>
        <div><span>Raids weathered</span><b>${state.raidCount}</b></div>
      </div>
      <button id="restart-btn" class="action-btn outcome-restart">Begin Anew</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('restart-btn')!.addEventListener('click', handlers.onReset);
  return overlay;
}

export function syncOverlays(state: GameState, handlers: OverlayHandlers) {
  const kind = statusToKind(state.status);
  if (kind === currentKind && state.status === lastStatus) return;

  clearOverlay();
  lastStatus = state.status;
  currentKind = kind;

  if (kind === 'doctrine') currentEl = mountDoctrine(handlers);
  else if (kind === 'investigation') currentEl = mountInvestigation(state, handlers);
  else if (kind === 'outcome') currentEl = mountOutcome(state, handlers);
}
