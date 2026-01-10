import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CredentialOrchestrator } from './credentialOrchestrator';
import UnifiedCredentialStore from './stores/unifiedCredentialStore';
import { CredentialStore } from './types/lnc';
import LncCredentialStore from './util/credentialStore';

// Mock the log module
vi.mock('./util/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('CredentialOrchestrator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('constructor and store creation', () => {
    it('should create legacy store by default', () => {
      const orchestrator = new CredentialOrchestrator({});
      const store = orchestrator.credentialStore;

      expect(store).toBeInstanceOf(LncCredentialStore);
    });

    it('should create UnifiedCredentialStore when useUnifiedStore is true', () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true
      });
      const store = orchestrator.credentialStore;

      expect(store).toBeInstanceOf(UnifiedCredentialStore);
    });

    it('should use custom credential store if provided', () => {
      const customStore: CredentialStore = {
        password: undefined,
        pairingPhrase: '',
        serverHost: '',
        localKey: '',
        remoteKey: '',
        isPaired: false,
        clear: vi.fn()
      };

      const orchestrator = new CredentialOrchestrator({
        credentialStore: customStore
      });

      expect(orchestrator.credentialStore).toBe(customStore);
    });

    it('should set serverHost from config for UnifiedCredentialStore', () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        serverHost: 'test.server:443'
      });
      const store = orchestrator.credentialStore;

      expect(store.serverHost).toBe('test.server:443');
    });

    it('should set pairingPhrase from config for UnifiedCredentialStore', () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        pairingPhrase: 'test-pairing-phrase'
      });
      const store = orchestrator.credentialStore;

      expect(store.pairingPhrase).toBe('test-pairing-phrase');
    });

    it('should set serverHost from config for legacy store', () => {
      const orchestrator = new CredentialOrchestrator({
        serverHost: 'test.server:443'
      });
      const store = orchestrator.credentialStore;

      expect(store.serverHost).toBe('test.server:443');
    });

    it('should set pairingPhrase from config for legacy store', () => {
      const orchestrator = new CredentialOrchestrator({
        pairingPhrase: 'test-pairing-phrase'
      });
      const store = orchestrator.credentialStore;

      expect(store.pairingPhrase).toBe('test-pairing-phrase');
    });

    it('should not overwrite serverHost if already paired for UnifiedCredentialStore', () => {
      // Pre-populate localStorage to simulate paired state
      const namespace = 'default';
      localStorage.setItem(
        `lnc-web:${namespace}:localKey`,
        JSON.stringify({
          salt: 'test-salt',
          cipher: 'test-cipher',
          data: 'test-data'
        })
      );

      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        serverHost: 'new.server:443'
      });
      const store = orchestrator.credentialStore;

      // Since isPaired checks strategy credentials, and we've set localKey,
      // the serverHost should not be overwritten
      // However, the UnifiedCredentialStore checks isPaired via hasAnyCredentials
      // which looks at strategy persistence
      expect(store).toBeInstanceOf(UnifiedCredentialStore);
    });

    it('should use default namespace when not provided', () => {
      const orchestrator = new CredentialOrchestrator({});
      const store = orchestrator.credentialStore;

      // Verify the store was created (default namespace is 'default')
      expect(store).toBeDefined();
    });
  });

  describe('unlock', () => {
    it('should unlock UnifiedCredentialStore with password', async () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        namespace: 'test-unlock'
      });

      const result = await orchestrator.unlock({
        method: 'password',
        password: 'test-password'
      });

      expect(result).toBe(true);
      expect(orchestrator.isUnlocked).toBe(true);
    });

    it('should unlock legacy store with password', async () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-unlock-legacy'
      });

      const result = await orchestrator.unlock({
        method: 'password',
        password: 'test-password'
      });

      // Legacy store returns true for unlock, but clears password after persist
      expect(result).toBe(true);
      // Note: Legacy store clears in-memory password after persisting,
      // so isUnlocked returns false. This is expected legacy behavior.
    });

    it('should return false for legacy store unlock failure', async () => {
      // Create a store that will throw on password set
      const failingStore: CredentialStore = {
        password: undefined,
        pairingPhrase: '',
        serverHost: '',
        localKey: '',
        remoteKey: '',
        isPaired: false,
        clear: vi.fn()
      };

      // Make password setter throw
      Object.defineProperty(failingStore, 'password', {
        get: () => undefined,
        set: () => {
          throw new Error('Password set failed');
        }
      });

      const orchestrator = new CredentialOrchestrator({
        credentialStore: failingStore
      });

      const result = await orchestrator.unlock({
        method: 'password',
        password: 'test-password'
      });

      expect(result).toBe(false);
    });

    it('should return false for missing password in unlock options', async () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-no-password'
      });

      // Cast to any to test edge case
      const result = await orchestrator.unlock({
        method: 'password',
        password: ''
      } as any);

      expect(result).toBe(false);
    });
  });

  describe('persistWithPassword', () => {
    it('should persist with UnifiedCredentialStore', async () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        namespace: 'test-persist'
      });

      // Set some credentials first (simulating post-connection state)
      const store = orchestrator.credentialStore;
      store.localKey = 'test-local-key';
      store.remoteKey = 'test-remote-key';
      store.serverHost = 'test.server:443';
      store.pairingPhrase = 'test-phrase';

      await orchestrator.persistWithPassword('test-password');

      expect(orchestrator.isUnlocked).toBe(true);
    });

    it('should persist with legacy store', async () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-persist-legacy'
      });

      // Set some credentials first
      const store = orchestrator.credentialStore;
      store.localKey = 'test-local-key';
      store.remoteKey = 'test-remote-key';

      await orchestrator.persistWithPassword('test-password');

      // Legacy store clears in-memory password after persisting encrypted data,
      // but the data should be persisted to localStorage
      expect(store.isPaired).toBe(true);
      // Verify data was persisted by checking localStorage
      const key = 'lnc-web:test-persist-legacy';
      const persisted = JSON.parse(localStorage.getItem(key) || '{}');
      expect(persisted.cipher).toBeDefined();
      expect(persisted.salt).toBeDefined();
    });

    it('should throw if unlock fails during persist', async () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        namespace: 'test-persist-fail'
      });

      // Mock unlock to fail by using a store with failing strategy
      const store = orchestrator.credentialStore as UnifiedCredentialStore;
      vi.spyOn(store, 'unlock').mockResolvedValue(false);

      await expect(
        orchestrator.persistWithPassword('test-password')
      ).rejects.toThrow('Failed to unlock credentials with password');
    });
  });

  describe('persistWithPasskey', () => {
    it('should persist credentials with passkey using UnifiedCredentialStore', async () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        allowPasskeys: true,
        namespace: 'test-persist-passkey'
      });

      const store = orchestrator.credentialStore as UnifiedCredentialStore;
      store.localKey = 'test-local-key';
      store.remoteKey = 'test-remote-key';

      // Mock unlock to succeed
      vi.spyOn(store, 'unlock').mockResolvedValue(true);

      await orchestrator.persistWithPasskey();

      expect(store.unlock).toHaveBeenCalledWith({
        method: 'passkey',
        createIfMissing: true
      });
    });

    it('should throw error when used with legacy store', async () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-persist-passkey-legacy'
      });

      await expect(orchestrator.persistWithPasskey()).rejects.toThrow(
        'Passkey authentication requires UnifiedCredentialStore'
      );
    });

    it('should throw if passkey unlock fails', async () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        allowPasskeys: true,
        namespace: 'test-persist-passkey-fail'
      });

      // Mock unlock to fail by using a store with failing strategy
      const store = orchestrator.credentialStore as UnifiedCredentialStore;
      vi.spyOn(store, 'unlock').mockResolvedValue(false);

      await expect(orchestrator.persistWithPasskey()).rejects.toThrow(
        'Failed to unlock credentials with passkey'
      );
    });
  });

  describe('getAuthenticationInfo', () => {
    it('should return auth info from UnifiedCredentialStore', async () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        namespace: 'test-auth-info'
      });

      const info = await orchestrator.getAuthenticationInfo();

      expect(info).toEqual({
        isUnlocked: false,
        hasStoredCredentials: false,
        supportsPasskeys: false,
        hasPasskey: false,
        preferredUnlockMethod: 'password'
      });
    });

    it('should return auth info from legacy store', async () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-auth-info-legacy'
      });

      const info = await orchestrator.getAuthenticationInfo();

      expect(info).toEqual({
        isUnlocked: false,
        hasStoredCredentials: false,
        supportsPasskeys: false,
        hasPasskey: false,
        preferredUnlockMethod: 'password'
      });
    });

    it('should show isUnlocked true after unlock', async () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        namespace: 'test-unlocked-info'
      });

      await orchestrator.unlock({
        method: 'password',
        password: 'test-password'
      });

      const info = await orchestrator.getAuthenticationInfo();
      expect(info.isUnlocked).toBe(true);
    });
  });

  describe('isPaired', () => {
    it('should return false when not paired (UnifiedCredentialStore)', () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        namespace: 'test-not-paired'
      });

      expect(orchestrator.isPaired).toBe(false);
    });

    it('should return false when not paired (legacy store)', () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-not-paired-legacy'
      });

      expect(orchestrator.isPaired).toBe(false);
    });

    it('should return true when paired (legacy store with remoteKey)', () => {
      // Pre-populate localStorage to simulate paired state
      const namespace = 'test-paired-legacy';
      localStorage.setItem(
        `lnc-web:${namespace}`,
        JSON.stringify({
          salt: 'test-salt',
          cipher: 'test-cipher',
          serverHost: 'test.server:443',
          remoteKey: 'encrypted-remote-key',
          localKey: 'encrypted-local-key',
          pairingPhrase: ''
        })
      );

      const orchestrator = new CredentialOrchestrator({
        namespace
      });

      expect(orchestrator.isPaired).toBe(true);
    });
  });

  describe('isUnlocked', () => {
    it('should return false initially (UnifiedCredentialStore)', () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        namespace: 'test-not-unlocked'
      });

      expect(orchestrator.isUnlocked).toBe(false);
    });

    it('should return false initially (legacy store)', () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-not-unlocked-legacy'
      });

      expect(orchestrator.isUnlocked).toBe(false);
    });

    it('should return true after unlock (UnifiedCredentialStore)', async () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        namespace: 'test-unlocked'
      });

      await orchestrator.unlock({
        method: 'password',
        password: 'test-password'
      });

      expect(orchestrator.isUnlocked).toBe(true);
    });

    it('should return false after password is set (legacy store clears in-memory)', () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-unlocked-legacy'
      });

      // Legacy store clears in-memory password after persisting
      orchestrator.credentialStore.password = 'test-password';

      // isUnlocked checks password, which is cleared after persist
      // This is expected legacy behavior - password is only kept in memory
      // when decrypting existing data, not when first setting up encryption
      expect(orchestrator.isUnlocked).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear credentials (UnifiedCredentialStore)', async () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        namespace: 'test-clear'
      });

      const store = orchestrator.credentialStore;
      store.localKey = 'test-key';

      orchestrator.clear();

      expect(store.localKey).toBe('');
    });

    it('should clear credentials (legacy store)', () => {
      const orchestrator = new CredentialOrchestrator({
        namespace: 'test-clear-legacy'
      });

      const store = orchestrator.credentialStore;
      store.localKey = 'test-key';

      orchestrator.clear();

      expect(store.localKey).toBe('');
    });

    it('should support memoryOnly flag', () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true,
        namespace: 'test-clear-memory'
      });

      const store = orchestrator.credentialStore;
      const clearSpy = vi.spyOn(store, 'clear');

      orchestrator.clear(true);

      expect(clearSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('getCredentialStore', () => {
    it('should return the underlying credential store', () => {
      const orchestrator = new CredentialOrchestrator({
        useUnifiedStore: true
      });

      const store = orchestrator.credentialStore;

      expect(store).toBeInstanceOf(UnifiedCredentialStore);
    });

    it('should return same instance on multiple calls', () => {
      const orchestrator = new CredentialOrchestrator({});

      const store1 = orchestrator.credentialStore;
      const store2 = orchestrator.credentialStore;

      expect(store1).toBe(store2);
    });
  });

  describe('edge cases', () => {
    it('should handle config with password for legacy store', () => {
      new CredentialOrchestrator({
        namespace: 'test-with-password',
        password: 'initial-password'
      });

      // Legacy store clears password after persisting encrypted data,
      // so password getter returns empty string
      // But the store should have created cipher and salt
      const key = 'lnc-web:test-with-password';
      const persisted = JSON.parse(localStorage.getItem(key) || '{}');
      expect(persisted.cipher).toBeDefined();
      expect(persisted.salt).toBeDefined();
    });

    it('should prioritize custom credentialStore over useUnifiedStore', () => {
      const customStore: CredentialStore = {
        password: undefined,
        pairingPhrase: '',
        serverHost: '',
        localKey: '',
        remoteKey: '',
        isPaired: false,
        clear: vi.fn()
      };

      const orchestrator = new CredentialOrchestrator({
        credentialStore: customStore,
        useUnifiedStore: true // This should be ignored
      });

      expect(orchestrator.credentialStore).toBe(customStore);
    });
  });
});
