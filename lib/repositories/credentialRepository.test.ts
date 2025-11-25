import { beforeEach, describe, expect, it } from 'vitest';
import { UnlockOptions } from '../types/lnc';
import { BaseCredentialRepository } from './credentialRepository';

/**
 * Concrete implementation of BaseCredentialRepository for testing
 */
class TestCredentialRepository extends BaseCredentialRepository {
  private unlocked = false;

  async getCredential(key: string): Promise<string | undefined> {
    return this.get(key);
  }

  async setCredential(key: string, value: string): Promise<void> {
    if (!this.unlocked) {
      throw new Error('Repository is locked');
    }
    this.set(key, value);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async unlock(_options: UnlockOptions): Promise<void> {
    this.unlocked = true;
  }

  get isUnlocked(): boolean {
    return this.unlocked;
  }

  lock(): void {
    this.unlocked = false;
  }
}

describe('BaseCredentialRepository', () => {
  let repository: TestCredentialRepository;

  beforeEach(() => {
    localStorage.clear();
    repository = new TestCredentialRepository('test-namespace');
  });

  describe('credential storage', () => {
    it('should store and retrieve credentials', async () => {
      await repository.unlock({ method: 'password', password: 'test' });
      await repository.setCredential('key1', 'value1');
      expect(await repository.getCredential('key1')).toBe('value1');
    });

    it('should return undefined for non-existent credentials', async () => {
      expect(await repository.getCredential('nonexistent')).toBeUndefined();
    });

    it('should check if credential exists', async () => {
      await repository.unlock({ method: 'password', password: 'test' });
      expect(repository.hasCredential('key1')).toBe(false);
      await repository.setCredential('key1', 'value1');
      expect(repository.hasCredential('key1')).toBe(true);
    });

    it('should check if any credentials exist', async () => {
      expect(repository.hasAnyCredentials).toBe(false);
      await repository.unlock({ method: 'password', password: 'test' });
      await repository.setCredential('key1', 'value1');
      expect(repository.hasAnyCredentials).toBe(true);
    });

    it('should remove credentials', async () => {
      await repository.unlock({ method: 'password', password: 'test' });
      await repository.setCredential('key1', 'value1');
      expect(repository.hasCredential('key1')).toBe(true);
      await repository.removeCredential('key1');
      expect(repository.hasCredential('key1')).toBe(false);
    });

    it('should clear all credentials', async () => {
      await repository.unlock({ method: 'password', password: 'test' });
      await repository.setCredential('key1', 'value1');
      await repository.setCredential('key2', 'value2');
      expect(repository.hasAnyCredentials).toBe(true);
      repository.clear();
      expect(repository.hasAnyCredentials).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    it('should persist credentials to localStorage', async () => {
      await repository.unlock({ method: 'password', password: 'test' });
      await repository.setCredential('key1', 'value1');

      const stored = localStorage.getItem('lnc-web:test-namespace');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.key1).toBe('value1');
    });

    it('should load credentials from localStorage', async () => {
      localStorage.setItem(
        'lnc-web:test-namespace',
        JSON.stringify({ key1: 'value1' })
      );

      const newRepository = new TestCredentialRepository('test-namespace');
      expect(await newRepository.getCredential('key1')).toBe('value1');
    });

    it('should remove localStorage key when all credentials are cleared', async () => {
      await repository.unlock({ method: 'password', password: 'test' });
      await repository.setCredential('key1', 'value1');
      expect(localStorage.getItem('lnc-web:test-namespace')).not.toBeNull();
      repository.clear();
      expect(localStorage.getItem('lnc-web:test-namespace')).toBeNull();
    });

    it('should handle invalid JSON in localStorage gracefully', async () => {
      localStorage.setItem('lnc-web:test-namespace', 'invalid-json');
      const newRepository = new TestCredentialRepository('test-namespace');
      // Should not throw, just log error and return undefined
      expect(await newRepository.getCredential('key1')).toBeUndefined();
    });
  });

  describe('unlock/lock', () => {
    it('should unlock the repository', async () => {
      expect(repository.isUnlocked).toBe(false);
      await repository.unlock({ method: 'password', password: 'test' });
      expect(repository.isUnlocked).toBe(true);
    });

    it('should lock the repository', async () => {
      await repository.unlock({ method: 'password', password: 'test' });
      expect(repository.isUnlocked).toBe(true);
      repository.lock();
      expect(repository.isUnlocked).toBe(false);
    });

    it('should throw when setting credential while locked', async () => {
      await expect(repository.setCredential('key1', 'value1')).rejects.toThrow(
        'Repository is locked'
      );
    });
  });

  describe('namespace isolation', () => {
    it('should isolate credentials by namespace', async () => {
      const repo1 = new TestCredentialRepository('namespace1');
      const repo2 = new TestCredentialRepository('namespace2');

      await repo1.unlock({ method: 'password', password: 'test' });
      await repo2.unlock({ method: 'password', password: 'test' });

      await repo1.setCredential('key1', 'value1');
      await repo2.setCredential('key1', 'value2');

      expect(await repo1.getCredential('key1')).toBe('value1');
      expect(await repo2.getCredential('key1')).toBe('value2');
    });
  });

  describe('localStorage unavailable', () => {
    it('should handle localStorage being undefined', async () => {
      const originalLocalStorage = globalThis.localStorage;
      // @ts-expect-error - testing undefined localStorage
      delete globalThis.localStorage;

      const repo = new TestCredentialRepository('test-namespace');
      await repo.unlock({ method: 'password', password: 'test' });

      // Should not throw when localStorage is unavailable
      expect(() => repo.hasAnyCredentials).not.toThrow();
      expect(repo.hasAnyCredentials).toBe(false);

      // Credentials should be set and retrieved
      repo.setCredential('key1', 'value1');
      expect(await repo.getCredential('key1')).toBe('value1');

      // Credentials should be removed
      await repo.removeCredential('key1');
      expect(await repo.getCredential('key1')).toBeUndefined();

      // Credentials should be cleared
      repo.clear();
      expect(repo.hasAnyCredentials).toBe(false);

      globalThis.localStorage = originalLocalStorage;
    });
  });
});
