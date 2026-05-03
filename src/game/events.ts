import { makeFollower, randomName, type Follower, type GameState } from './state';

type CultEvent = {
  text: string;
  weight: number;
  apply: (state: GameState) => GameState;
};

function adjustAllSanity(followers: Follower[], delta: number): Follower[] {
  return followers.map((f) => ({
    ...f,
    sanity: Math.max(0, Math.min(100, f.sanity + delta)),
  }));
}

const events: CultEvent[] = [
  {
    text: 'A stranger appears at the gate, eyes hollow. They join the fold.',
    weight: 3,
    apply: (s) => {
      const id = `f${s.nextFollowerId}`;
      const f = makeFollower(id, randomName(), -6.5, 0);
      return {
        ...s,
        followers: [...s.followers, f],
        nextFollowerId: s.nextFollowerId + 1,
      };
    },
  },
  {
    text: 'Whispers crawl from beneath the stones. The fold listens.',
    weight: 3,
    apply: (s) => ({
      ...s,
      followers: adjustAllSanity(s.followers, -5),
      resources: { ...s.resources, forbidden: s.resources.forbidden + 4 },
    }),
  },
  {
    text: 'One of the fold flees into the dark before dawn.',
    weight: 2,
    apply: (s) => {
      if (s.followers.length <= 1) return s;
      const idx = Math.floor(Math.random() * s.followers.length);
      const fled = s.followers[idx];
      return {
        ...s,
        followers: s.followers.filter((_, i) => i !== idx),
        selectedFollowerId: s.selectedFollowerId === fled.id ? null : s.selectedFollowerId,
        log: [...s.log, `${fled.name} could not bear it. They are gone.`].slice(-30),
      };
    },
  },
  {
    text: 'A body is found at the gate. No one asks how.',
    weight: 2,
    apply: (s) => ({
      ...s,
      resources: { ...s.resources, bodies: s.resources.bodies + 1 },
    }),
  },
  {
    text: 'The fold sings together. For a moment, the dread thins.',
    weight: 2,
    apply: (s) => ({
      ...s,
      followers: adjustAllSanity(s.followers, 10),
    }),
  },
  {
    text: 'The brazier burns black for an hour. Faith hardens.',
    weight: 1,
    apply: (s) => ({
      ...s,
      resources: { ...s.resources, faith: s.resources.faith + 6 },
    }),
  },
  {
    text: 'Nightmares walk the compound. None sleep well.',
    weight: 1,
    apply: (s) => ({
      ...s,
      followers: adjustAllSanity(s.followers, -8),
    }),
  },
];

function pickEvent(): CultEvent {
  const total = events.reduce((sum, e) => sum + e.weight, 0);
  let r = Math.random() * total;
  for (const e of events) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return events[0];
}

export function rollDailyEvent(state: GameState): GameState {
  const e = pickEvent();
  const withLog: GameState = { ...state, log: [...state.log, e.text].slice(-30) };
  return e.apply(withLog);
}
