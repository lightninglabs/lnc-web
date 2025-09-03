import { SessionData } from '../types';

const STORAGE_PREFIX = 'lnc-session:';

/**
 * Handles session data persistence in sessionStorage.
 * Single responsibility: session data storage and retrieval.
 */
export class SessionStorage {
    constructor(private namespace: string) {}

    save(sessionData: SessionData) {
        const storageKey = `${STORAGE_PREFIX}${this.namespace}`;
        sessionStorage.setItem(storageKey, JSON.stringify(sessionData));
        console.log(
            '[SessionStorage] Session saved to sessionStorage',
            sessionData
        );
    }

    load(): SessionData | undefined {
        try {
            const storageKey = `${STORAGE_PREFIX}${this.namespace}`;
            const stored = sessionStorage.getItem(storageKey);

            if (!stored) {
                return undefined;
            }

            const parsed = JSON.parse(stored);

            // Validate required fields
            if (
                !parsed.sessionId ||
                !parsed.deviceFingerprint ||
                !parsed.encryptedCredentials
            ) {
                return undefined;
            }

            console.log(
                '[SessionStorage] Session loaded from sessionStorage',
                parsed
            );

            return parsed as SessionData;
        } catch {
            return undefined;
        }
    }

    clear(): void {
        const storageKey = `${STORAGE_PREFIX}${this.namespace}`;
        sessionStorage.removeItem(storageKey);
    }

    hasData(): boolean {
        const storageKey = `${STORAGE_PREFIX}${this.namespace}`;
        return sessionStorage.getItem(storageKey) !== null;
    }
}
