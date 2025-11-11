import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';
import { CredentialCache } from './credentialCache';
import { SessionCredentials } from '../sessions/types';

// Mock console methods to avoid noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {});

// Test data factory
const createTestSessionCredentials = (): SessionCredentials => ({
    localKey: 'test-local-key',
    remoteKey: 'test-remote-key',
    pairingPhrase: 'test-pairing-phrase',
    serverHost: 'test-server-host.example.com:443',
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
});

describe('CredentialCache', () => {
    let cache: CredentialCache;

    beforeEach(() => {
        cache = new CredentialCache();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance with empty cache', () => {
            const newCache = new CredentialCache();

            expect(newCache).toBeInstanceOf(CredentialCache);
            expect(newCache.size()).toBe(0);
            expect(newCache.isEmpty()).toBe(true);
        });
    });

    describe('get()', () => {
        it('should return undefined for non-existent key', () => {
            const result = cache.get('non-existent-key');

            expect(result).toBeUndefined();
        });

        it('should return the value for an existing key', () => {
            const key = 'test-key';
            const value = 'test-value';

            cache.set(key, value);
            const result = cache.get(key);

            expect(result).toBe(value);
        });

        it('should return undefined after clearing the cache', () => {
            const key = 'test-key';
            const value = 'test-value';

            cache.set(key, value);
            cache.clear();
            const result = cache.get(key);

            expect(result).toBeUndefined();
        });
    });

    describe('set()', () => {
        it('should set a value for a key', () => {
            const key = 'test-key';
            const value = 'test-value';

            cache.set(key, value);

            expect(cache.get(key)).toBe(value);
            expect(cache.has(key)).toBe(true);
            expect(cache.size()).toBe(1);
        });

        it('should overwrite existing value for the same key', () => {
            const key = 'test-key';
            const originalValue = 'original-value';
            const newValue = 'new-value';

            cache.set(key, originalValue);
            cache.set(key, newValue);

            expect(cache.get(key)).toBe(newValue);
            expect(cache.size()).toBe(1);
        });

        it('should handle multiple different keys', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            expect(cache.size()).toBe(3);
            expect(cache.get('key1')).toBe('value1');
            expect(cache.get('key2')).toBe('value2');
            expect(cache.get('key3')).toBe('value3');
        });
    });

    describe('has()', () => {
        it('should return false for non-existent key', () => {
            expect(cache.has('non-existent-key')).toBe(false);
        });

        it('should return true for existing key', () => {
            const key = 'test-key';
            const value = 'test-value';

            cache.set(key, value);

            expect(cache.has(key)).toBe(true);
        });

        it('should return false after removing a key', () => {
            const key = 'test-key';
            const value = 'test-value';

            cache.set(key, value);
            // Note: CredentialCache doesn't have a remove method, so we test with clear
            cache.clear();

            expect(cache.has(key)).toBe(false);
        });
    });

    describe('hasAny()', () => {
        it('should return false for empty cache', () => {
            expect(cache.hasAny()).toBe(false);
        });

        it('should return true when cache has at least one credential', () => {
            cache.set('test-key', 'test-value');

            expect(cache.hasAny()).toBe(true);
        });

        it('should return false after clearing all credentials', () => {
            cache.set('test-key', 'test-value');
            cache.clear();

            expect(cache.hasAny()).toBe(false);
        });
    });

    describe('clear()', () => {
        it('should clear all credentials from cache', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            expect(cache.size()).toBe(3);

            cache.clear();

            expect(cache.size()).toBe(0);
            expect(cache.hasAny()).toBe(false);
            expect(cache.isEmpty()).toBe(true);
        });

        it('should handle clearing empty cache without error', () => {
            expect(cache.size()).toBe(0);

            cache.clear();

            expect(cache.size()).toBe(0);
        });
    });

    describe('getAll()', () => {
        it('should return empty Map for empty cache', () => {
            const result = cache.getAll();

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        });

        it('should return Map with all credentials', () => {
            const credentials = new Map([
                ['key1', 'value1'],
                ['key2', 'value2'],
                ['key3', 'value3']
            ]);

            credentials.forEach((value, key) => {
                cache.set(key, value);
            });

            const result = cache.getAll();

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(3);
            credentials.forEach((expectedValue, key) => {
                expect(result.get(key)).toBe(expectedValue);
            });
        });

        it('should return a copy, not reference to internal cache', () => {
            cache.set('test-key', 'test-value');

            const result = cache.getAll();
            result.set('new-key', 'new-value');

            expect(cache.has('new-key')).toBe(false);
            expect(cache.size()).toBe(1);
        });
    });

    describe('hydrateFromSession()', () => {
        it('should populate cache with session credentials', () => {
            const sessionCredentials = createTestSessionCredentials();

            cache.hydrateFromSession(sessionCredentials);

            expect(cache.get('localKey')).toBe(sessionCredentials.localKey);
            expect(cache.get('remoteKey')).toBe(sessionCredentials.remoteKey);
            expect(cache.get('pairingPhrase')).toBe(sessionCredentials.pairingPhrase);
            expect(cache.get('serverHost')).toBe(sessionCredentials.serverHost);
            expect(cache.size()).toBe(4);
        });

        it('should log hydration operation', () => {
            const sessionCredentials = createTestSessionCredentials();
            const consoleSpy = vi.spyOn(console, 'log');

            cache.hydrateFromSession(sessionCredentials);

            expect(consoleSpy).toHaveBeenCalledWith(
                '[CredentialCache] Hydrated from session:',
                {
                    hasLocalKey: !!sessionCredentials.localKey,
                    hasRemoteKey: !!sessionCredentials.remoteKey,
                    hasPairingPhrase: !!sessionCredentials.pairingPhrase,
                    serverHost: sessionCredentials.serverHost
                }
            );
        });

        it('should overwrite existing credentials when hydrating', () => {
            // Set some existing credentials
            cache.set('localKey', 'old-local-key');
            cache.set('remoteKey', 'old-remote-key');
            cache.set('existing-key', 'existing-value');

            const sessionCredentials = createTestSessionCredentials();

            cache.hydrateFromSession(sessionCredentials);

            // Session credentials should be set
            expect(cache.get('localKey')).toBe(sessionCredentials.localKey);
            expect(cache.get('remoteKey')).toBe(sessionCredentials.remoteKey);
            expect(cache.get('pairingPhrase')).toBe(sessionCredentials.pairingPhrase);
            expect(cache.get('serverHost')).toBe(sessionCredentials.serverHost);

            // Existing non-session credential should remain
            expect(cache.get('existing-key')).toBe('existing-value');
            expect(cache.size()).toBe(5); // 4 session + 1 existing
        });

        it('should handle empty session credentials', () => {
            const emptySession: SessionCredentials = {
                localKey: '',
                remoteKey: '',
                pairingPhrase: '',
                serverHost: '',
                expiresAt: Date.now()
            };

            cache.hydrateFromSession(emptySession);

            expect(cache.get('localKey')).toBe('');
            expect(cache.get('remoteKey')).toBe('');
            expect(cache.get('pairingPhrase')).toBe('');
            expect(cache.get('serverHost')).toBe('');
            expect(cache.size()).toBe(4);
        });
    });

    describe('keys()', () => {
        it('should return empty array for empty cache', () => {
            const result = cache.keys();

            expect(result).toEqual([]);
        });

        it('should return array of all keys', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            const result = cache.keys();

            expect(result).toHaveLength(3);
            expect(result).toContain('key1');
            expect(result).toContain('key2');
            expect(result).toContain('key3');
        });
    });

    describe('values()', () => {
        it('should return empty array for empty cache', () => {
            const result = cache.values();

            expect(result).toEqual([]);
        });

        it('should return array of all values', () => {
            const testData = [
                ['key1', 'value1'],
                ['key2', 'value2'],
                ['key3', 'value3']
            ];

            testData.forEach(([key, value]) => cache.set(key, value));

            const result = cache.values();

            expect(result).toHaveLength(3);
            expect(result).toContain('value1');
            expect(result).toContain('value2');
            expect(result).toContain('value3');
        });
    });

    describe('size()', () => {
        it('should return 0 for empty cache', () => {
            expect(cache.size()).toBe(0);
        });

        it('should return correct size after adding credentials', () => {
            expect(cache.size()).toBe(0);

            cache.set('key1', 'value1');
            expect(cache.size()).toBe(1);

            cache.set('key2', 'value2');
            expect(cache.size()).toBe(2);

            cache.set('key3', 'value3');
            expect(cache.size()).toBe(3);
        });

        it('should return 0 after clearing', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');

            expect(cache.size()).toBe(2);

            cache.clear();
            expect(cache.size()).toBe(0);
        });
    });

    describe('isEmpty()', () => {
        it('should return true for empty cache', () => {
            expect(cache.isEmpty()).toBe(true);
        });

        it('should return false when cache has credentials', () => {
            cache.set('test-key', 'test-value');

            expect(cache.isEmpty()).toBe(false);
        });

        it('should return true after clearing', () => {
            cache.set('test-key', 'test-value');
            cache.clear();

            expect(cache.isEmpty()).toBe(true);
        });
    });

    describe('entries()', () => {
        it('should return empty array for empty cache', () => {
            const result = cache.entries();

            expect(result).toEqual([]);
        });

        it('should return array of key-value pairs', () => {
            const testData = [
                ['key1', 'value1'],
                ['key2', 'value2'],
                ['key3', 'value3']
            ];

            testData.forEach(([key, value]) => cache.set(key, value));

            const result = cache.entries();

            expect(result).toHaveLength(3);
            testData.forEach(([expectedKey, expectedValue]) => {
                const entry = result.find(([key]) => key === expectedKey);
                expect(entry).toEqual([expectedKey, expectedValue]);
            });
        });
    });

    describe('snapshot()', () => {
        it('should return empty object for empty cache', () => {
            const result = cache.snapshot();

            expect(result).toEqual({});
        });

        it('should return object with all credentials', () => {
            const testData = {
                key1: 'value1',
                key2: 'value2',
                key3: 'value3'
            };

            Object.entries(testData).forEach(([key, value]) => {
                cache.set(key, value);
            });

            const result = cache.snapshot();

            expect(result).toEqual(testData);
        });

        it('should return a copy, not reference to internal cache', () => {
            cache.set('test-key', 'test-value');

            const result = cache.snapshot();
            result['new-key'] = 'new-value';

            expect(cache.has('new-key')).toBe(false);
        });
    });

    describe('Integration tests', () => {
        it('should support full credential lifecycle', () => {
            // Start empty
            expect(cache.isEmpty()).toBe(true);

            // Add credentials
            cache.set('localKey', 'test-local');
            cache.set('remoteKey', 'test-remote');
            cache.set('pairingPhrase', 'test-phrase');

            expect(cache.size()).toBe(3);
            expect(cache.hasAny()).toBe(true);

            // Access credentials
            expect(cache.get('localKey')).toBe('test-local');
            expect(cache.get('remoteKey')).toBe('test-remote');
            expect(cache.get('pairingPhrase')).toBe('test-phrase');

            // Check iteration methods
            expect(cache.keys()).toEqual(['localKey', 'remoteKey', 'pairingPhrase']);
            expect(cache.values()).toEqual(['test-local', 'test-remote', 'test-phrase']);

            // Hydrate from session (should overwrite existing)
            const sessionCredentials = createTestSessionCredentials();
            cache.hydrateFromSession(sessionCredentials);

            expect(cache.size()).toBe(4); // 4 session fields
            expect(cache.get('localKey')).toBe(sessionCredentials.localKey);
            expect(cache.get('serverHost')).toBe(sessionCredentials.serverHost);

            // Snapshot
            const snapshot = cache.snapshot();
            expect(Object.keys(snapshot)).toHaveLength(4);

            // Clear
            cache.clear();
            expect(cache.isEmpty()).toBe(true);
            expect(cache.size()).toBe(0);
        });
    });
});
