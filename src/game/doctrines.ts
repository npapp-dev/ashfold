export type Doctrine = 'whisperers' | 'flesheaters' | 'veiled';

export type DoctrineMod = {
  faithMult: number;
  studyMult: number;
  sacrificeMult: number;
  recruitCostMult: number;
  bodyDripEveryDays?: number;
};

export const DOCTRINES: Record<
  Doctrine,
  { name: string; tagline: string; description: string; mod: DoctrineMod }
> = {
  whisperers: {
    name: 'The Whisperers',
    tagline: 'Knowledge from the cracks of the world',
    description:
      'You listen at the broken places. Forbidden study yields more, but the fold prays poorly. +50% Forbidden gain, −25% Faith gain.',
    mod: {
      faithMult: 0.75,
      studyMult: 1.5,
      sacrificeMult: 1.0,
      recruitCostMult: 1.0,
    },
  },
  flesheaters: {
    name: 'The Flesh-Eaters',
    tagline: 'The body is the doorway',
    description:
      'You feast on the dead. Sacrifices are mightier and the rites draw bodies on their own. +50% sacrifice rewards. A body appears every third day.',
    mod: {
      faithMult: 1.0,
      studyMult: 1.0,
      sacrificeMult: 1.5,
      recruitCostMult: 1.0,
      bodyDripEveryDays: 3,
    },
  },
  veiled: {
    name: 'The Veiled',
    tagline: 'Hidden, until the end',
    description:
      'You walk unseen. New disciples come cheaper and the fold prays harder. −25% recruit cost, +25% Faith gain.',
    mod: {
      faithMult: 1.25,
      studyMult: 1.0,
      sacrificeMult: 1.0,
      recruitCostMult: 0.75,
    },
  },
};

const NEUTRAL: DoctrineMod = {
  faithMult: 1,
  studyMult: 1,
  sacrificeMult: 1,
  recruitCostMult: 1,
};

export function getMod(doctrine: Doctrine | null): DoctrineMod {
  if (!doctrine) return NEUTRAL;
  return DOCTRINES[doctrine].mod;
}

export function doctrineName(doctrine: Doctrine | null): string {
  return doctrine ? DOCTRINES[doctrine].name : '—';
}
