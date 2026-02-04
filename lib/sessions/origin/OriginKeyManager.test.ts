import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '../../util/log';
import { OriginKeyData, OriginKeyManager } from './OriginKeyManager';

interface FakeIndexedDB {
  indexedDB: IDBFactory;
  behavior: {
    failOpen: boolean;
    failGet: boolean;
    failPut: boolean;
    failDelete: boolean;
  };
  store: Map<string, any>;
}

const createFakeIndexedDB = (): FakeIndexedDB => {
  const store = new Map<string, any>();
  const behavior = {
    failOpen: false,
    failGet: false,
    failPut: false,
    failDelete: false
  };
  const storeNames = new Set<string>();

  const createRequest = <T>() => {
    const request: any = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: undefined,
      error: undefined
    };
    return request as IDBRequest<T>;
  };

  class FakeObjectStore {
    constructor(private readonly namespaceStore: Map<string, any>) {}

    get(key: string) {
      const request = createRequest<any>();
      queueMicrotask(() => {
        if (behavior.failGet) {
          (request as any).error = new Error('get failed');
          request.onerror?.({ target: request } as any);
          return;
        }
        (request as any).result = this.namespaceStore.get(key);
        request.onsuccess?.({ target: request } as any);
      });
      return request;
    }

    put(data: any) {
      const request = createRequest<IDBValidKey>();
      queueMicrotask(() => {
        if (behavior.failPut) {
          (request as any).error = new Error('put failed');
          request.onerror?.({ target: request } as any);
          return;
        }
        this.namespaceStore.set(data.namespace, data);
        request.onsuccess?.({ target: request } as any);
      });
      return request;
    }

    delete(key: string) {
      const request = createRequest<void>();
      queueMicrotask(() => {
        if (behavior.failDelete) {
          (request as any).error = new Error('delete failed');
          request.onerror?.({ target: request } as any);
          return;
        }
        this.namespaceStore.delete(key);
        request.onsuccess?.({ target: request } as any);
      });
      return request;
    }

    createIndex(): void {
      // no-op for tests
    }
  }

  class FakeTransaction {
    constructor(private readonly namespaceStore: Map<string, any>) {}

    objectStore(): FakeObjectStore {
      return new FakeObjectStore(this.namespaceStore);
    }
  }

  class FakeDatabase {
    readonly objectStoreNames: any = {
      contains: (name: string) => storeNames.has(name)
    };

    transaction(_storeNamesArg: string[], _mode: IDBTransactionMode) {
      return new FakeTransaction(store);
    }

    createObjectStore(name: string) {
      storeNames.add(name);
      return new FakeObjectStore(store);
    }

    close(): void {
      // no-op for tests
    }
  }

  const open: IDBFactory['open'] = () => {
    const request = createRequest<IDBDatabase>() as unknown as IDBOpenDBRequest;
    queueMicrotask(() => {
      if (behavior.failOpen) {
        (request as any).error = new Error('open failed');
        request.onerror?.({ target: request } as any);
        return;
      }
      const db = new FakeDatabase();
      (request as any).result = db as unknown as IDBDatabase;
      request.onupgradeneeded?.({ target: request } as any);
      request.onsuccess?.({ target: request } as any);
    });
    return request;
  };

  return {
    indexedDB: {
      open
    } as unknown as IDBFactory,
    behavior,
    store
  };
};

describe('OriginKeyManager', () => {
  let originKeyManager: OriginKeyManager;
  let mockCryptoKey: CryptoKey;
  const namespace = 'test-namespace';
  let fakeIndexedDB: FakeIndexedDB;
  let originalIndexedDB: typeof indexedDB;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCryptoKey = {
      type: 'secret',
      algorithm: { name: 'AES-GCM' }
    } as CryptoKey;

    // Mock crypto.subtle
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        subtle: {
          generateKey: vi.fn().mockResolvedValue(mockCryptoKey)
        }
      },
      writable: true
    });

    originalIndexedDB = globalThis.indexedDB;
    fakeIndexedDB = createFakeIndexedDB();
    Object.defineProperty(globalThis, 'indexedDB', {
      value: fakeIndexedDB.indexedDB,
      writable: true,
      configurable: true
    });

    originKeyManager = new OriginKeyManager(namespace);
  });

  afterEach(() => {
    if (originalIndexedDB === undefined) {
      delete (globalThis as any).indexedDB;
    } else {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: originalIndexedDB,
        writable: true,
        configurable: true
      });
    }
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with namespace', () => {
      const manager = new OriginKeyManager('test-namespace');
      expect(manager).toBeInstanceOf(OriginKeyManager);
    });
  });

  describe('getOrCreateOriginKey()', () => {
    it('should return existing key if not expired', async () => {
      const existingKeyData: OriginKeyData = {
        originKey: mockCryptoKey,
        expiresAt: Date.now() + 3600000 // 1 hour from now
      };

      // Mock loadOriginKey to return existing key
      vi.spyOn(originKeyManager as any, 'loadOriginKey').mockResolvedValue(
        existingKeyData
      );

      const result = await originKeyManager.getOrCreateOriginKey();

      expect(result).toEqual(existingKeyData);
      expect(globalThis.crypto.subtle.generateKey).not.toHaveBeenCalled();
    });

    it('should create new key if no existing key found', async () => {
      // Mock loadOriginKey to return undefined
      vi.spyOn(originKeyManager as any, 'loadOriginKey').mockResolvedValue(
        undefined
      );
      // Mock saveOriginKey to succeed
      vi.spyOn(originKeyManager as any, 'saveOriginKey').mockResolvedValue(
        undefined
      );

      const result = await originKeyManager.getOrCreateOriginKey();

      expect(result.originKey).toBe(mockCryptoKey);
      expect(typeof result.expiresAt).toBe('number');
      expect(result.expiresAt).toBeGreaterThan(Date.now());
      expect(globalThis.crypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        false,
        ['wrapKey', 'unwrapKey']
      );
      expect((originKeyManager as any).saveOriginKey).toHaveBeenCalledWith(
        mockCryptoKey,
        result.expiresAt
      );
    });

    it('should create new key if existing key is expired', async () => {
      const expiredKeyData: OriginKeyData = {
        originKey: { type: 'expired' } as unknown as CryptoKey,
        expiresAt: Date.now() - 3600000 // 1 hour ago
      };

      // Mock loadOriginKey to return expired key
      vi.spyOn(originKeyManager as any, 'loadOriginKey').mockResolvedValue(
        expiredKeyData
      );
      // Mock saveOriginKey to succeed
      vi.spyOn(originKeyManager as any, 'saveOriginKey').mockResolvedValue(
        undefined
      );

      const result = await originKeyManager.getOrCreateOriginKey();

      expect(result.originKey).toBe(mockCryptoKey);
      expect(globalThis.crypto.subtle.generateKey).toHaveBeenCalled();
      expect((originKeyManager as any).saveOriginKey).toHaveBeenCalled();
    });

    it('should handle key generation failure', async () => {
      const error = new Error('Key generation failed');
      globalThis.crypto.subtle.generateKey = vi.fn().mockRejectedValue(error);

      // Mock loadOriginKey to return undefined
      vi.spyOn(originKeyManager as any, 'loadOriginKey').mockResolvedValue(
        undefined
      );

      await expect(originKeyManager.getOrCreateOriginKey()).rejects.toThrow(
        'Failed to get or create origin key: Key generation failed'
      );
    });

    it('should handle save failure', async () => {
      const error = new Error('Save failed');

      // Mock loadOriginKey to return undefined
      vi.spyOn(originKeyManager as any, 'loadOriginKey').mockResolvedValue(
        undefined
      );
      // Mock saveOriginKey to fail
      vi.spyOn(originKeyManager as any, 'saveOriginKey').mockRejectedValue(
        error
      );

      await expect(originKeyManager.getOrCreateOriginKey()).rejects.toThrow(
        'Failed to get or create origin key: Save failed'
      );
    });
  });

  describe('loadOriginKey()', () => {
    it('should be tested via integration with getOrCreateOriginKey', async () => {
      // Since loadOriginKey uses complex IndexedDB operations that are hard to mock,
      // we'll test it indirectly through getOrCreateOriginKey which calls it
      const keyData: OriginKeyData = {
        originKey: mockCryptoKey,
        expiresAt: Date.now() + 3600000
      };

      vi.spyOn(originKeyManager as any, 'loadOriginKey').mockResolvedValue(
        keyData
      );

      const result = await originKeyManager.getOrCreateOriginKey();

      expect(result).toEqual(keyData);
      expect((originKeyManager as any).loadOriginKey).toHaveBeenCalled();
    });
  });

  describe('IndexedDB integration', () => {
    beforeEach(() => {
      fakeIndexedDB.behavior.failOpen = false;
      fakeIndexedDB.behavior.failGet = false;
      fakeIndexedDB.behavior.failPut = false;
      fakeIndexedDB.behavior.failDelete = false;
    });

    it('should save and load origin key using indexedDB', async () => {
      const expiresAt = Date.now() + 1000;

      await originKeyManager.saveOriginKey(mockCryptoKey, expiresAt);
      const loaded = await originKeyManager.loadOriginKey();

      expect(loaded).toEqual({ originKey: mockCryptoKey, expiresAt });
    });

    it('should return undefined when loadOriginKey encounters an error', async () => {
      fakeIndexedDB.behavior.failGet = true;

      const result = await originKeyManager.loadOriginKey();

      expect(result).toBeUndefined();
    });

    it('should throw descriptive error when saveOriginKey fails', async () => {
      fakeIndexedDB.behavior.failPut = true;

      await expect(
        originKeyManager.saveOriginKey(mockCryptoKey, Date.now())
      ).rejects.toThrow('Failed to save origin key');
    });

    it('should clear origin key successfully', async () => {
      // First save a key so there's something to clear.
      await originKeyManager.saveOriginKey(mockCryptoKey, Date.now() + 1000);
      expect(fakeIndexedDB.store.has(namespace)).toBe(true);

      await originKeyManager.clearOriginKey();

      expect(fakeIndexedDB.store.has(namespace)).toBe(false);
    });

    it('should reject when clearOriginKey delete fails', async () => {
      fakeIndexedDB.behavior.failDelete = true;

      await expect(originKeyManager.clearOriginKey()).rejects.toThrow(
        'Failed to clear origin key'
      );
    });

    it('should warn when clearOriginKey cannot open database', async () => {
      fakeIndexedDB.behavior.failOpen = true;
      const warnSpy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);

      await originKeyManager.clearOriginKey();

      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to clear origin key:',
        expect.any(Error)
      );

      warnSpy.mockRestore();
    });

    it('should return undefined when openDB fails during load', async () => {
      fakeIndexedDB.behavior.failOpen = true;

      const result = await originKeyManager.loadOriginKey();

      expect(result).toBeUndefined();
    });

    it('should return undefined when stored record is incomplete', async () => {
      const expiresAt = Date.now() + 1000;
      fakeIndexedDB.store.set(namespace, {
        namespace,
        expiresAt
      });

      const result = await originKeyManager.loadOriginKey();

      expect(result).toBeUndefined();
    });

    it('should reject when openDB fails during save', async () => {
      fakeIndexedDB.behavior.failOpen = true;

      await expect(
        originKeyManager.saveOriginKey(mockCryptoKey, Date.now())
      ).rejects.toThrow('Failed to save origin key: Failed to open IndexedDB');
    });
  });

  describe('saveOriginKey()', () => {
    it('should be tested via integration with getOrCreateOriginKey', async () => {
      // Since saveOriginKey uses complex IndexedDB operations that are hard to mock,
      // we'll test it indirectly through getOrCreateOriginKey which calls it
      vi.spyOn(originKeyManager as any, 'loadOriginKey').mockResolvedValue(
        undefined
      );
      vi.spyOn(originKeyManager as any, 'saveOriginKey').mockResolvedValue(
        undefined
      );

      await originKeyManager.getOrCreateOriginKey();

      expect((originKeyManager as any).saveOriginKey).toHaveBeenCalledWith(
        mockCryptoKey,
        expect.any(Number)
      );
    });
  });

  describe('Private methods', () => {
    describe('isExpired()', () => {
      it('should return true for expired timestamp', () => {
        const expiredTime = Date.now() - 1000; // 1 second ago
        const result = (originKeyManager as any).isExpired(expiredTime);
        expect(result).toBe(true);
      });

      it('should return false for future timestamp', () => {
        const futureTime = Date.now() + 3600000; // 1 hour from now
        const result = (originKeyManager as any).isExpired(futureTime);
        expect(result).toBe(false);
      });

      it('should return false for current timestamp', () => {
        const currentTime = Date.now();
        const result = (originKeyManager as any).isExpired(currentTime);
        expect(result).toBe(false);
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle full workflow: load expired key, create new key, save it', async () => {
      const expiredKeyData = {
        originKey: { type: 'expired' } as unknown as CryptoKey,
        expiresAt: Date.now() - 3600000 // expired
      };

      // Mock loadOriginKey to return expired key
      vi.spyOn(originKeyManager as any, 'loadOriginKey').mockResolvedValue(
        expiredKeyData
      );
      // Mock saveOriginKey to succeed
      vi.spyOn(originKeyManager as any, 'saveOriginKey').mockResolvedValue(
        undefined
      );

      const result = await originKeyManager.getOrCreateOriginKey();

      expect(result.originKey).toBe(mockCryptoKey); // New key
      expect(result.expiresAt).toBeGreaterThan(Date.now());
      expect(globalThis.crypto.subtle.generateKey).toHaveBeenCalled();
      expect((originKeyManager as any).saveOriginKey).toHaveBeenCalled();
    });

    it('should handle full workflow: no existing key, create and save new key', async () => {
      // Mock loadOriginKey to return undefined
      vi.spyOn(originKeyManager as any, 'loadOriginKey').mockResolvedValue(
        undefined
      );
      // Mock saveOriginKey to succeed
      vi.spyOn(originKeyManager as any, 'saveOriginKey').mockResolvedValue(
        undefined
      );

      const result = await originKeyManager.getOrCreateOriginKey();

      expect(result.originKey).toBe(mockCryptoKey);
      expect(result.expiresAt).toBeGreaterThan(Date.now());
      expect(globalThis.crypto.subtle.generateKey).toHaveBeenCalled();
      expect((originKeyManager as any).saveOriginKey).toHaveBeenCalled();
    });
  });
});
