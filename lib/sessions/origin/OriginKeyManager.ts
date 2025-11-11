import { log } from '../../util/log';

export interface OriginKeyData {
  originKey: CryptoKey;
  expiresAt: number;
}

/**
 * Manages origin-bound keys for session security.
 * Single responsibility: origin key lifecycle management.
 * Self-contained implementation using IndexedDB directly.
 */
export class OriginKeyManager {
  private dbName = 'lnc-origin-keys';
  private dbVersion = 1;
  private storeName = 'keys';
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  async getOrCreateOriginKey(): Promise<OriginKeyData> {
    try {
      const existing = await this.loadOriginKey();

      if (existing && !this.isExpired(existing.expiresAt)) {
        return existing;
      }

      // Generate new origin key (non-extractable for security)
      const originKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false, // non-extractable for security
        ['wrapKey', 'unwrapKey']
      );

      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      await this.saveOriginKey(originKey, expiresAt);

      return { originKey, expiresAt };
    } catch (error) {
      throw new Error(
        `Failed to get or create origin key: ${(error as Error).message}`
      );
    }
  }

  async loadOriginKey(): Promise<OriginKeyData | undefined> {
    try {
      const db = await this.openDB();

      return new Promise((resolve) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(this.namespace);

        request.onsuccess = () => {
          const result = request.result;
          if (result && result.originKey && result.expiresAt) {
            // Return the stored CryptoKey directly
            resolve({
              originKey: result.originKey,
              expiresAt: result.expiresAt
            });
          } else {
            resolve(undefined);
          }
        };

        request.onerror = () => resolve(undefined);
      });
    } catch {
      return undefined;
    }
  }

  async saveOriginKey(originKey: CryptoKey, expiresAt: number): Promise<void> {
    try {
      const db = await this.openDB();

      const data = {
        namespace: this.namespace,
        originKey, // Store non-extractable CryptoKey directly
        expiresAt,
        createdAt: Date.now()
      };

      // Store the CryptoKey directly in IndexedDB (structured cloning handles it)
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          reject(new Error('Failed to save origin key'));
        };
      });
    } catch (error) {
      throw new Error(`Failed to save origin key: ${(error as Error).message}`);
    }
  }

  isExpired(expiresAt: number): boolean {
    return Date.now() > expiresAt;
  }

  async clearOriginKey(): Promise<void> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(this.namespace);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear origin key'));
      });
    } catch (error) {
      log.warn('Failed to clear origin key:', error);
    }
  }

  /**
   * Open (or create/upgrade) the IndexedDB database used to persist
   * origin-bound keys for this namespace.
   */
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'namespace'
          });
          store.createIndex('expiresAt', 'expiresAt', {
            unique: false
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    });
  }
}
