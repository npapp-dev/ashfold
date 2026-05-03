import {
  ASCEND_COST,
  avgSanity,
  canAscend,
  makeFollower,
  randomName,
  type GameState,
  type GameStatus,
  type Task,
} from './state';
import { getMod, type Doctrine } from './doctrines';

export function selectFollower(state: GameState, id: string | null): GameState {
  return { ...state, selectedFollowerId: id };
}

export function assignTask(state: GameState, followerId: string, task: Task): GameState {
  if (state.status !== 'playing') return state;
  return {
    ...state,
    followers: state.followers.map((f) => {
      if (f.id !== followerId) return f;
      if (f.task === 'broken') return f;
      return { ...f, task };
    }),
  };
}

export function appendLog(state: GameState, line: string): GameState {
  return { ...state, log: [...state.log, line].slice(-30) };
}

export function recruitCost(state: GameState): number {
  const base = Math.max(10, 5 * state.followers.length);
  return Math.round(base * getMod(state.doctrine).recruitCostMult);
}

export function recruitFollower(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  const cost = recruitCost(state);
  if (state.resources.faith < cost) return state;

  const id = `f${state.nextFollowerId}`;
  const f = makeFollower(
    id,
    randomName(),
    -6.5 + (Math.random() - 0.5) * 0.4,
    (Math.random() - 0.5) * 0.4,
  );

  return {
    ...state,
    followers: [...state.followers, f],
    nextFollowerId: state.nextFollowerId + 1,
    resources: { ...state.resources, faith: state.resources.faith - cost },
    log: [...state.log, `${f.name} bends the knee. The fold grows.`].slice(-30),
  };
}

export function pickDoctrine(state: GameState, doctrine: Doctrine): GameState {
  if (state.status !== 'doctrine-pick') return state;
  return { ...state, doctrine, status: 'playing' };
}

export function ascend(state: GameState): GameState {
  if (!canAscend(state)) return state;
  const avg = avgSanity(state) ?? 0;
  let outcome: GameStatus;
  if (avg >= 60) outcome = 'won-apotheosis';
  else if (avg >= 30) outcome = 'won-pyrrhic';
  else outcome = 'lost-catastrophe';
  return {
    ...state,
    resources: {
      faith: state.resources.faith - ASCEND_COST.faith,
      forbidden: state.resources.forbidden - ASCEND_COST.forbidden,
      bodies: state.resources.bodies - ASCEND_COST.bodies,
    },
    status: outcome,
    log: [...state.log, 'The final ritual begins. The brazier devours the world.'].slice(-30),
  };
}

export function raidCost(state: GameState): number {
  return 25 + state.raidCount * 15;
}

export function payInvestigator(state: GameState): GameState {
  if (state.status !== 'investigation') return state;
  const cost = raidCost(state);
  if (state.resources.faith < cost) return state;
  return {
    ...state,
    resources: { ...state.resources, faith: state.resources.faith - cost },
    suspicion: 0,
    raidCount: state.raidCount + 1,
    status: 'playing',
    log: [...state.log, `The fold paid ${cost} Faith. The hunter slipped back into the trees.`].slice(-30),
  };
}

export function fightInvestigator(state: GameState): GameState {
  if (state.status !== 'investigation') return state;
  const killCount = Math.min(state.followers.length, 1 + Math.floor(Math.random() * 2));
  const survivors = [...state.followers];
  const fallen: string[] = [];
  for (let i = 0; i < killCount; i++) {
    if (survivors.length === 0) break;
    const idx = Math.floor(Math.random() * survivors.length);
    fallen.push(survivors[idx].name);
    survivors.splice(idx, 1);
  }
  const newStatus: GameStatus = survivors.length === 0 ? 'lost-empty' : 'playing';
  const stillSelected = survivors.find((f) => f.id === state.selectedFollowerId)?.id ?? null;
  return {
    ...state,
    followers: survivors,
    selectedFollowerId: stillSelected,
    suspicion: Math.max(0, state.suspicion - 30),
    raidCount: state.raidCount + 1,
    status: newStatus,
    log: [
      ...state.log,
      fallen.length > 0
        ? `Blood at the gate. ${fallen.join(', ')} fell beneath the hunter.`
        : 'The hunter passes. None fell.',
    ].slice(-30),
  };
}
