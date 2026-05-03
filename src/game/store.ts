import { initialState, type GameState } from './state';

let state: GameState = initialState();

export function getState(): GameState {
  return state;
}

export function setState(next: GameState): void {
  state = next;
}

export function update(updater: (s: GameState) => GameState): void {
  state = updater(state);
}
