import { createEmptyStore, type DataStore } from './types.js';

let store: DataStore = createEmptyStore();

export function getStore(): DataStore {
  return store;
}

/** Test helper — resets all in-memory state. */
export function resetStore(): void {
  store = createEmptyStore();
}

export * from './types.js';
