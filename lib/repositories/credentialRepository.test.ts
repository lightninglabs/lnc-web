import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
import { BaseCredentialRepository } from './credentialRepository';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock log methods
vi.spyOn(log, 'info').mockImplementation(() => {});
vi.spyOn(log, 'error').mockImplementation(() => {});

// Create a concrete implementation for testing
class TestCredentialRepository extends BaseCredentialRepository {
  private unlocked = false;

  async getCredential(key: string): Promise<string | undefined> {
    if (!this.isUnlocked) return undefined;
    return this.get(key);
  }

  async setCredential(key: string, value: string): Promise<void> {
    if (!this.isUnlocked) throw new Error('Repository is locked');
    this.set(key, value);
  }

  async unlock(): Promise<void> {
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
  const namespace = 'test-namespace';

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TestCredentialRepository(namespace);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with namespace', () => {
      const repo = new TestCredentialRepository('test-ns');
      expect(repo).toBeInstanceOf(TestCredentialRepository);
    });
  });

  describe('removeCredential()', () => {
    it('should remove credential using the remove method', async () => {
      // Set up some test data
      repository['credentials'].set('test-key', 'test-value');
      repository['credentials'].set('other-key', 'other-value'); // Keep some data so setItem is called

      await repository.removeCredential('test-key');

      expect(repository['credentials'].has('test-key')).toBe(false);
      expect(repository['credentials'].has('other-key')).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('hasCredential()', () => {
    it('should return false for non-existent key', () => {
      expect(repository.hasCredential('non-existent')).toBe(false);
    });

    it('should return true for existing key', () => {
      repository['credentials'].set('existing-key', 'value');

      expect(repository.hasCredential('existing-key')).toBe(true);
    });

    it('should trigger load when credentials map is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ 'stored-key': 'stored-value' })
      );

      const result = repository.hasCredential('stored-key');

      expect(result).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'lnc-web:test-namespace'
      );
    });
  });

  describe('hasAnyCredentials', () => {
    it('should return false when no credentials exist', () => {
      // Ensure repository is clean
      repository.clear();
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(repository.hasAnyCredentials).toBe(false);
    });

    it('should return true when credentials exist', () => {
      repository['credentials'].set('test-key', 'test-value');

      expect(repository.hasAnyCredentials).toBe(true);
    });

    it('should trigger load when credentials map is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ 'stored-key': 'stored-value' })
      );

      const result = repository.hasAnyCredentials;

      expect(result).toBe(true);
    });
  });

  describe('clear()', () => {
    it('should clear all credentials and save empty state', () => {
      repository['credentials'].set('key1', 'value1');
      repository['credentials'].set('key2', 'value2');

      repository.clear();

      expect(repository['credentials'].size).toBe(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'lnc-web:test-namespace'
      );
    });

    it('should handle localStorage not available', () => {
      // Temporarily make localStorage undefined
      const originalLocalStorage = globalThis.localStorage;
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true
      });

      expect(() => repository.clear()).not.toThrow();

      // Restore localStorage
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    });
  });

  describe('Private methods', () => {
    describe('storageKey getter', () => {
      it('should return correct storage key', () => {
        const key = (repository as any).storageKey;
        expect(key).toBe('lnc-web:test-namespace');
      });
    });

    describe('loadedCredentials getter', () => {
      it('should load credentials when map is empty', () => {
        mockLocalStorage.getItem.mockReturnValue(
          JSON.stringify({ 'loaded-key': 'loaded-value' })
        );

        const loaded = (repository as any).loadedCredentials;

        expect(loaded.get('loaded-key')).toBe('loaded-value');
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
          'lnc-web:test-namespace'
        );
      });

      it('should return existing credentials when map is not empty', () => {
        repository['credentials'].set('existing-key', 'existing-value');
        mockLocalStorage.getItem.mockReturnValue(
          JSON.stringify({ 'loaded-key': 'loaded-value' })
        );

        const loaded = (repository as any).loadedCredentials;

        expect(loaded.get('existing-key')).toBe('existing-value');
        expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
      });
    });

    describe('get()', () => {
      it('should return credential value', () => {
        repository['credentials'].set('test-key', 'test-value');

        const result = (repository as any).get('test-key');

        expect(result).toBe('test-value');
      });

      it('should return undefined for non-existent key', () => {
        const result = (repository as any).get('non-existent');

        expect(result).toBeUndefined();
      });
    });

    describe('set()', () => {
      it('should set credential and trigger save', () => {
        (repository as any).set('test-key', 'test-value');

        expect(repository['credentials'].get('test-key')).toBe('test-value');
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });

    describe('remove()', () => {
      it('should remove credential and trigger save', () => {
        repository['credentials'].set('test-key', 'test-value');
        repository['credentials'].set('other-key', 'other-value'); // Ensure we have data to save

        (repository as any).remove('test-key');

        expect(repository['credentials'].has('test-key')).toBe(false);
        expect(repository['credentials'].has('other-key')).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });

    describe('save()', () => {
      it('should save credentials to localStorage', () => {
        repository['credentials'].set('key1', 'value1');
        repository['credentials'].set('key2', 'value2');

        (repository as any).save();

        const expectedData = { key1: 'value1', key2: 'value2' };
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'lnc-web:test-namespace',
          JSON.stringify(expectedData)
        );
        expect(log.info).toHaveBeenCalledWith(
          '[CredentialRepository] saving credentials to localStorage'
        );
      });

      it('should remove item when no credentials exist', () => {
        repository['credentials'].clear();

        (repository as any).save();

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
          'lnc-web:test-namespace'
        );
      });

      it('should do nothing when localStorage is not available', () => {
        const originalLocalStorage = globalThis.localStorage;
        Object.defineProperty(globalThis, 'localStorage', {
          value: undefined,
          writable: true
        });

        repository['credentials'].set('test-key', 'test-value');

        expect(() => (repository as any).save()).not.toThrow();

        // Restore localStorage
        Object.defineProperty(globalThis, 'localStorage', {
          value: originalLocalStorage,
          writable: true
        });
      });
    });

    describe('load()', () => {
      it('should load credentials from localStorage', () => {
        const storedData = {
          'stored-key1': 'stored-value1',
          'stored-key2': 'stored-value2'
        };
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));

        (repository as any).load();

        expect(repository['credentials'].get('stored-key1')).toBe(
          'stored-value1'
        );
        expect(repository['credentials'].get('stored-key2')).toBe(
          'stored-value2'
        );
        expect(log.info).toHaveBeenCalledWith(
          '[CredentialRepository] loaded credentials from localStorage'
        );
      });

      it('should handle invalid JSON gracefully', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid json {');

        expect(() => (repository as any).load()).not.toThrow();
        expect(log.error).toHaveBeenCalled();
        expect(repository['credentials'].size).toBe(0);
      });

      it('should do nothing when no data exists in localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        (repository as any).load();

        expect(repository['credentials'].size).toBe(0);
      });

      it('should do nothing when localStorage is not available', () => {
        const originalLocalStorage = globalThis.localStorage;
        Object.defineProperty(globalThis, 'localStorage', {
          value: undefined,
          writable: true
        });

        expect(() => (repository as any).load()).not.toThrow();

        // Restore localStorage
        Object.defineProperty(globalThis, 'localStorage', {
          value: originalLocalStorage,
          writable: true
        });
      });
    });
  });

  describe('Integration tests', () => {
    it('should support full credential lifecycle', async () => {
      // Initially empty
      expect(repository.hasAnyCredentials).toBe(false);

      // Unlock repository
      await repository.unlock();
      expect(repository.isUnlocked).toBe(true);

      // Set credentials
      await repository.setCredential('localKey', 'test-local');
      await repository.setCredential('remoteKey', 'test-remote');

      expect(repository.hasAnyCredentials).toBe(true);
      expect(repository.hasCredential('localKey')).toBe(true);

      // Get credentials
      const localKey = await repository.getCredential('localKey');
      const remoteKey = await repository.getCredential('remoteKey');

      expect(localKey).toBe('test-local');
      expect(remoteKey).toBe('test-remote');

      // Remove credential
      await repository.removeCredential('remoteKey');
      expect(repository.hasCredential('remoteKey')).toBe(false);

      // Lock repository
      repository.lock();
      expect(repository.isUnlocked).toBe(false);

      // Clear all
      repository.clear();
      expect(repository.hasAnyCredentials).toBe(false);
    });

    it('should persist data across instances with same namespace', () => {
      // Set data in first instance
      repository['credentials'].set('shared-key', 'shared-value');
      (repository as any).save();

      // Create new instance with same namespace
      const newRepository = new TestCredentialRepository(namespace);

      // Trigger load
      expect(newRepository.hasAnyCredentials).toBeDefined();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'lnc-web:test-namespace'
      );
    });
  });
});
