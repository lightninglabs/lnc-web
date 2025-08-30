import { SessionData } from '../types';

/**
 * Handles session data persistence in sessionStorage.
 * Single responsibility: session data storage and retrieval.
 */
export class SessionStorage {
    constructor(private namespace: string) {}

    async save(sessionData: SessionData): Promise<void> {
        // intentionally corrupt the sessionId to make session restoration fail and test
        // what happens when we try to restore a session that is invalid
        // sessionData.sessionId += 'xxx';

        const storageKey = `lnc-session:${this.namespace}`;
        sessionStorage.setItem(storageKey, JSON.stringify(sessionData));
        console.log(
            '[SessionStorage] Session saved to sessionStorage',
            sessionData
        );
    }

    async load(): Promise<SessionData | undefined> {
        try {
            const storageKey = `lnc-session:${this.namespace}`;
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

    loadSync(): SessionData | undefined {
        try {
            const storageKey = `lnc-session:${this.namespace}`;
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

            return parsed as SessionData;
        } catch {
            return undefined;
        }
    }

    clear(): void {
        const storageKey = `lnc-session:${this.namespace}`;
        sessionStorage.removeItem(storageKey);
    }

    hasData(): boolean {
        const storageKey = `lnc-session:${this.namespace}`;
        return sessionStorage.getItem(storageKey) !== null;
    }
}
