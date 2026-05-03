import type { Follower, GameState, GameStatus, GameTime } from './state';
import { SUSPICION_THRESHOLD } from './state';
import { rollDailyEvent } from './events';
import { getMod, type DoctrineMod } from './doctrines';

const WALK_SPEED = 1.2;
const ARRIVE_THRESHOLD = 0.25;
const COMPOUND_RADIUS = 6;
const HOURS_PER_SECOND = 0.5;
const STUDY_RADIUS = 4.4;
const NUM_STONES = 8;
const BROKEN_RECOVER_THRESHOLD = 50;

const SACRIFICE_SUSPICION = 5;
const SACRIFICE_WITNESS_SANITY = 5;
const STUDY_SUSPICION_PER_SEC = 0.04;
const PASSIVE_SUSPICION_DECAY_PER_SEC = 0.005;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickWanderTarget() {
  const r = Math.sqrt(Math.random()) * COMPOUND_RADIUS;
  const a = Math.random() * Math.PI * 2;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
}

function getTaskTarget(f: Follower): { x: number; z: number } | null {
  if (f.task === 'idle' || f.task === 'broken') return null;
  if (f.task === 'pray') {
    const a = ((hashId(f.id) % 8) / 8) * Math.PI * 2;
    return { x: Math.cos(a) * 1.85, z: Math.sin(a) * 1.85 };
  }
  if (f.task === 'sacrifice') return { x: 0, z: 1.4 };
  if (f.task === 'study') {
    const idx = hashId(f.id) % NUM_STONES;
    const a = (idx / NUM_STONES) * Math.PI * 2;
    return { x: Math.cos(a) * STUDY_RADIUS, z: Math.sin(a) * STUDY_RADIUS };
  }
  return null;
}

function isNight(time: GameTime): boolean {
  return time.hour < 6 || time.hour > 19;
}

type Delta = { faith: number; forbidden: number; bodies: number };

function stepFollower(
  f: Follower,
  dt: number,
  isNightNow: boolean,
  delta: Delta,
  suspicion: { value: number },
  deadIds: Set<string>,
  sacrificeCount: { value: number },
  newLogs: string[],
  mod: DoctrineMod,
): Follower {
  let { targetX, targetZ } = f;
  const taskTarget = getTaskTarget(f);
  if (taskTarget) {
    targetX = taskTarget.x;
    targetZ = taskTarget.z;
  } else if (Math.hypot(targetX - f.x, targetZ - f.z) < ARRIVE_THRESHOLD) {
    const t = pickWanderTarget();
    targetX = t.x;
    targetZ = t.z;
  }

  const dx = targetX - f.x;
  const dz = targetZ - f.z;
  const dist = Math.hypot(dx, dz);

  let nx = f.x;
  let nz = f.z;
  let nextTask = f.task;
  let sanityDelta = 0;

  if (dist > ARRIVE_THRESHOLD) {
    const step = Math.min(dist, WALK_SPEED * dt);
    nx = f.x + (dx / dist) * step;
    nz = f.z + (dz / dist) * step;
    if (f.task === 'idle') sanityDelta = 0.06 * dt;
    else if (f.task === 'broken') sanityDelta = 0.14 * dt;
  } else if (f.task === 'pray') {
    delta.faith += 0.4 * dt * mod.faithMult;
    sanityDelta = 0.18 * dt;
  } else if (f.task === 'study') {
    delta.forbidden += 0.5 * dt * mod.studyMult;
    sanityDelta = -0.28 * dt;
    suspicion.value += STUDY_SUSPICION_PER_SEC * dt;
  } else if (f.task === 'sacrifice') {
    if (isNightNow) {
      deadIds.add(f.id);
      sacrificeCount.value += 1;
      delta.faith += 8 * mod.sacrificeMult;
      delta.forbidden += 4 * mod.sacrificeMult;
      delta.bodies += 1;
      suspicion.value += SACRIFICE_SUSPICION;
    }
  } else if (f.task === 'idle') {
    sanityDelta = 0.12 * dt;
  } else if (f.task === 'broken') {
    sanityDelta = 0.2 * dt;
  }

  const newSanity = Math.max(0, Math.min(100, f.sanity + sanityDelta));

  if (newSanity <= 0 && nextTask !== 'broken') {
    nextTask = 'broken';
    newLogs.push(`${f.name}'s mind has shattered.`);
  } else if (nextTask === 'broken' && newSanity >= BROKEN_RECOVER_THRESHOLD) {
    nextTask = 'idle';
    newLogs.push(`${f.name} returns from the dark.`);
  }

  return { ...f, x: nx, z: nz, targetX, targetZ, task: nextTask, sanity: newSanity };
}

export function tick(state: GameState, dt: number): GameState {
  if (state.status !== 'playing') return state;

  const mod = getMod(state.doctrine);
  const isNightNow = isNight(state.time);
  const delta: Delta = { faith: 0, forbidden: 0, bodies: 0 };
  const suspicion = { value: state.suspicion };
  const deadIds = new Set<string>();
  const sacrificeCount = { value: 0 };
  const newLogs: string[] = [];

  const stepped = state.followers.map((f) =>
    stepFollower(f, dt, isNightNow, delta, suspicion, deadIds, sacrificeCount, newLogs, mod),
  );

  let aliveFollowers = stepped.filter((f) => !deadIds.has(f.id));

  if (sacrificeCount.value > 0) {
    const witnessHit = sacrificeCount.value * SACRIFICE_WITNESS_SANITY;
    aliveFollowers = aliveFollowers.map((f) => {
      const wouldBe = f.sanity - witnessHit;
      const newSanity = Math.max(0, wouldBe);
      let nextTask = f.task;
      if (wouldBe <= 0 && nextTask !== 'broken') {
        nextTask = 'broken';
        newLogs.push(`${f.name}'s mind has shattered.`);
      }
      return { ...f, sanity: newSanity, task: nextTask };
    });

    for (const id of deadIds) {
      const dead = state.followers.find((orig) => orig.id === id);
      if (dead) newLogs.push(`${dead.name} gave themselves to the brazier.`);
    }
  }

  const selectedFollowerId =
    state.selectedFollowerId && deadIds.has(state.selectedFollowerId)
      ? null
      : state.selectedFollowerId;

  suspicion.value = Math.max(0, suspicion.value - PASSIVE_SUSPICION_DECAY_PER_SEC * dt);

  let { day, hour } = state.time;
  hour += HOURS_PER_SECOND * dt;
  let dayChanged = false;
  while (hour >= 24) {
    hour -= 24;
    day += 1;
    dayChanged = true;
  }

  const resources = {
    faith: Math.max(0, state.resources.faith + delta.faith),
    forbidden: Math.max(0, state.resources.forbidden + delta.forbidden),
    bodies: Math.max(0, state.resources.bodies + delta.bodies),
  };

  let newStatus: GameStatus = state.status;
  if (suspicion.value >= SUSPICION_THRESHOLD) {
    newStatus = 'investigation';
  }

  let next: GameState = {
    ...state,
    followers: aliveFollowers,
    selectedFollowerId,
    resources,
    time: { day, hour },
    suspicion: suspicion.value,
    status: newStatus,
  };

  if (newLogs.length > 0) {
    next = { ...next, log: [...next.log, ...newLogs].slice(-30) };
  }

  if (dayChanged) {
    if (mod.bodyDripEveryDays && day % mod.bodyDripEveryDays === 0) {
      next = {
        ...next,
        resources: { ...next.resources, bodies: next.resources.bodies + 1 },
        log: [...next.log, 'Flesh-rite. A body lies at the brazier come dawn.'].slice(-30),
      };
    }
    if (day > state.lastEventDay && newStatus === 'playing') {
      next = rollDailyEvent({ ...next, lastEventDay: day });
    }
  }

  if (next.followers.length === 0 && newStatus === 'playing') {
    next = {
      ...next,
      status: 'lost-empty',
      log: [...next.log, 'No one remains. The brazier dies.'].slice(-30),
    };
  }

  return next;
}
