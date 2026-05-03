import type { Doctrine } from './doctrines';

export type Task = 'idle' | 'pray' | 'study' | 'sacrifice' | 'broken';

export type Follower = {
  id: string;
  name: string;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  task: Task;
  sanity: number;
};

export type Resources = {
  faith: number;
  forbidden: number;
  bodies: number;
};

export type GameTime = {
  day: number;
  hour: number;
};

export type GameStatus =
  | 'doctrine-pick'
  | 'playing'
  | 'investigation'
  | 'won-apotheosis'
  | 'won-pyrrhic'
  | 'lost-catastrophe'
  | 'lost-empty';

export type GameState = {
  followers: Follower[];
  resources: Resources;
  time: GameTime;
  log: string[];
  selectedFollowerId: string | null;
  lastEventDay: number;
  nextFollowerId: number;
  doctrine: Doctrine | null;
  status: GameStatus;
  suspicion: number;
  raidCount: number;
};

export const ASCEND_COST = { forbidden: 100, bodies: 5, faith: 50 };
export const SUSPICION_THRESHOLD = 50;

const NAMES = [
  'Mara', 'Vex', 'Corin', 'Isolde', 'Branwen', 'Tharne',
  'Yseult', 'Oren', 'Lir', 'Sable', 'Wren', 'Cassia',
];

const COMPOUND_RADIUS = 6;

export function randomName(): string {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}

export function makeFollower(id: string, name: string, x = 0, z = 0): Follower {
  return { id, name, x, z, targetX: x, targetZ: z, task: 'idle', sanity: 100 };
}

export function avgSanity(state: GameState): number | null {
  if (state.followers.length === 0) return null;
  return state.followers.reduce((sum, f) => sum + f.sanity, 0) / state.followers.length;
}

export function isEndgame(status: GameStatus): boolean {
  return status.startsWith('won-') || status.startsWith('lost-');
}

export function canAscend(state: GameState): boolean {
  return (
    state.status === 'playing' &&
    state.resources.forbidden >= ASCEND_COST.forbidden &&
    state.resources.bodies >= ASCEND_COST.bodies &&
    state.resources.faith >= ASCEND_COST.faith
  );
}

export function initialState(): GameState {
  const followers: Follower[] = [];
  for (let i = 0; i < 4; i++) {
    const r = Math.sqrt(Math.random()) * COMPOUND_RADIUS;
    const a = Math.random() * Math.PI * 2;
    followers.push(makeFollower(`f${i}`, NAMES[i], Math.cos(a) * r, Math.sin(a) * r));
  }
  return {
    followers,
    resources: { faith: 0, forbidden: 0, bodies: 0 },
    time: { day: 1, hour: 18 },
    log: ['The fold gathers in the hollow.'],
    selectedFollowerId: null,
    lastEventDay: 1,
    nextFollowerId: 4,
    doctrine: null,
    status: 'doctrine-pick',
    suspicion: 0,
    raidCount: 0,
  };
}
