import type { GameState } from './state';

const KEY = 'ashfold:save:v1';

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('save failed', err);
  }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const followers = (parsed.followers as Array<Record<string, unknown>>) ?? [];
    parsed.followers = followers.map((f) => ({
      ...f,
      sanity: typeof f.sanity === 'number' ? f.sanity : 100,
    }));

    const resources = parsed.resources as Record<string, unknown>;
    if (resources && 'sanity' in resources) {
      delete resources.sanity;
    }

    if (parsed.doctrine === undefined) parsed.doctrine = null;
    if (parsed.suspicion === undefined) parsed.suspicion = 0;
    if (parsed.raidCount === undefined) parsed.raidCount = 0;
    if (parsed.status === undefined) {
      parsed.status = parsed.doctrine ? 'playing' : 'doctrine-pick';
    }

    return parsed as unknown as GameState;
  } catch (err) {
    console.warn('load failed', err);
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(KEY);
}
