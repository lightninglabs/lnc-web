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

  /**
   * Namespace isolates origin keys per LNC instance.
   */
  constructor(namespace: string) {
    this.namespace = namespace;
  }

  /**
   * Check whether the stored origin key is past its validity window.
   */
  isExpired(expiresAt: number): boolean {
    // Expiry uses wall-clock time so session restore can fail closed.
    return Date.now() > expiresAt;
  }

  /**
   * Return a usable origin key, creating and persisting one if needed.
   */
  async getOrCreateOriginKey(): Promise<OriginKeyData> {
    try {
      // Prefer an existing non-expired key to avoid unnecessary key churn.
      const existing = await this.loadOriginKey();

      if (existing && !this.isExpired(existing.expiresAt)) {
        return existing;
      }

      // Generate new origin key. This is not extractable so that the raw key material
      // can never be obtained in clear text. This is a security measure to lock down
      // the key so it cannot be used outside the browser. It also can only be accessed by
      // code running on the same origin that created it (terminal.lightning.engineering).
      const originKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false, // non-extractable for security
        ['wrapKey', 'unwrapKey']
      );

      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // Persist immediately so restore paths can resolve the same wrapping key.
      await this.saveOriginKey(originKey, expiresAt);

      return { originKey, expiresAt };
    } catch (error) {
      throw new Error(
        `Failed to get or create origin key: ${(error as Error).message}`
      );
    }
  }

  /**
   * Load the origin key for this namespace from IndexedDB.
   */
  async loadOriginKey(): Promise<OriginKeyData | undefined> {
    try {
      return await this.withDB((db) => {
        return new Promise((resolve) => {
          const transaction = db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.get(this.namespace);

          request.onsuccess = () => {
            const result = request.result;
            if (
              result &&
              result.originKey &&
              typeof result.originKey === 'object' &&
              !Array.isArray(result.originKey) &&
              typeof result.expiresAt === 'number' &&
              Number.isFinite(result.expiresAt)
            ) {
              // Return the stored CryptoKey directly.
              resolve({
                originKey: result.originKey,
                expiresAt: result.expiresAt
              });
            } else {
              // Treat incomplete records as missing data to keep restore logic strict.
              resolve(undefined);
            }
          };

          request.onerror = () => resolve(undefined);
        });
      });
    } catch (error) {
      log.error(`Failed to load origin key: ${(error as Error).message}`);
      // Caller treats missing/failed reads the same and can recreate a key.
      return undefined;
    }
  }

  /**
   * Persist the origin key and expiry metadata for this namespace.
   */
  async saveOriginKey(originKey: CryptoKey, expiresAt: number): Promise<void> {
    try {
      await this.withDB((db) => {
        // Store the origin key and expiry metadata for this namespace. The origin key
        // can be stored in IndexedDB directly. When retrieved, it will maintain its
        // non-extractable status.
        const data = {
          namespace: this.namespace,
          originKey,
          expiresAt,
          createdAt: Date.now()
        };

        // Store the CryptoKey directly in IndexedDB (structured cloning handles it).
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);

          const request = store.put(data);
          request.onsuccess = () => resolve();
          request.onerror = () => {
            reject(
              new Error(`Failed to save origin key: ${request.error?.message}`)
            );
          };
        });
      });
    } catch (error) {
      log.error(
        `Failed to save origin key: ${(error as Error).message}`,
        error
      );
      throw new Error(`Failed to save origin key: ${(error as Error).message}`);
    }
  }

  /**
   * Remove this namespace's origin key record from IndexedDB.
   */
  async clearOriginKey(): Promise<void> {
    try {
      await this.withDB((db) => {
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.delete(this.namespace);

          request.onsuccess = () => {
            log.info('[OriginKeyManager] Origin key cleared', {
              namespace: this.namespace
            });
            resolve();
          };
          request.onerror = () =>
            reject(
              new Error(
                `[OriginKeyManager] Failed to clear origin key: ${request.error?.message}`
              )
            );
        });
      });
    } catch (error) {
      // Clearing is best-effort; do not throw from cleanup paths.
      log.warn('Failed to clear origin key:', error);
    }
  }

  /**
   * Open a database connection, run the callback, and always close the handle.
   * Separating open/close from business logic keeps each caller's try/catch
   * free of a finally block, which avoids an untestable v8 coverage branch.
   */
  private async withDB<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
    const db = await this.openDB();
    try {
      return await fn(db);
    } finally {
      db.close();
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
          // Use namespace as the primary key so each app namespace owns one record.
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
