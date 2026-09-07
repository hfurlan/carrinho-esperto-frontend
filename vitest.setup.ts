import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/*
 * jsdom does not expose Web Storage under this Node build (Node ships an
 * experimental `localStorage` global that shadows jsdom's and is inert without
 * --localstorage-file). Install a minimal in-memory Storage so the app's token
 * persistence and the tests behave like a real browser.
 */
class MemoryStorage implements Storage {
  #map = new Map<string, string>();

  get length(): number {
    return this.#map.size;
  }
  clear(): void {
    this.#map.clear();
  }
  getItem(key: string): string | null {
    return this.#map.has(key) ? (this.#map.get(key) as string) : null;
  }
  key(index: number): string | null {
    return Array.from(this.#map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.#map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.#map.set(key, String(value));
  }
}

for (const target of [globalThis, globalThis.window]) {
  if (!target) continue;
  const existing = target.localStorage;
  if (!existing || typeof existing.clear !== 'function') {
    Object.defineProperty(target, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});
