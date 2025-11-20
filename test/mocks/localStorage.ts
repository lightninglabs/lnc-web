import { vi } from 'vitest';

/**
 * Enhanced localStorage mock for testing credential storage
 */
export class MockLocalStorage {
  private storage: Map<string, string> = new Map();

  // Vitest spies for tracking calls
  getItem = vi.fn((key: string): string | null => {
    return this.storage.get(key) || null;
  });

  setItem = vi.fn((key: string, value: string): void => {
    this.storage.set(key, value);
  });

  removeItem = vi.fn((key: string): void => {
    this.storage.delete(key);
  });

  clear = vi.fn((): void => {
    this.storage.clear();
  });

  key = vi.fn((index: number): string | null => {
    const keys = Array.from(this.storage.keys());
    return keys[index] || null;
  });

  get length(): number {
    return this.storage.size;
  }

  // Additional utility methods for testing
  hasItem(key: string): boolean {
    return this.storage.has(key);
  }

  getAllItems(): Record<string, string> {
    return Object.fromEntries(this.storage);
  }

  setItems(items: Record<string, string>): void {
    Object.entries(items).forEach(([key, value]) => {
      this.setItem(key, value);
    });
  }

  reset(): void {
    this.storage.clear();
    // Clear mock call history
    this.getItem.mockClear();
    this.setItem.mockClear();
    this.removeItem.mockClear();
    this.clear.mockClear();
    this.key.mockClear();
  }
}

/**
 * Create a fresh mock localStorage instance
 */
export const createMockLocalStorage = (): MockLocalStorage => {
  return new MockLocalStorage();
};
