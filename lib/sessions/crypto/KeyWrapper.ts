import CryptoService from '../cryptoService';
import { WrappedKey } from '../types';

export interface WrappedKeys {
    deviceWrap: WrappedKey;
    originWrap: WrappedKey;
}

/**
 * Handles wrapping and unwrapping of credentials keys.
 * Single responsibility: key wrapping/unwrapping operations.
 */
export class KeyWrapper {
    constructor(private cryptoService: CryptoService) {}

    async wrapCredentialsKey(
        credentialsKey: CryptoKey,
        deviceKey: CryptoKey,
        originKey: CryptoKey
    ): Promise<WrappedKeys> {
        const deviceWrap = await this.cryptoService.wrapWithDeviceKey(
            credentialsKey,
            deviceKey
        );
        const originWrap = await this.cryptoService.wrapWithOriginKey(
            credentialsKey,
            originKey
        );
        return { deviceWrap, originWrap };
    }

    async unwrapCredentialsKey(
        wrappedKeys: WrappedKeys,
        deviceKey: CryptoKey,
        originKey: CryptoKey
    ): Promise<CryptoKey> {
        // Unwrap from both sources
        const fromDevice = await this.cryptoService.unwrapWithDeviceKey(
            deviceKey,
            wrappedKeys.deviceWrap.keyB64,
            wrappedKeys.deviceWrap.ivB64
        );
        const fromOrigin = await this.cryptoService.unwrapWithOriginKey(
            originKey,
            wrappedKeys.originWrap.keyB64,
            wrappedKeys.originWrap.ivB64
        );

        // Verify keys match (paranoid check)
        if (!(await this.keysMatch(fromDevice, fromOrigin))) {
            throw new Error('Key unwrapping mismatch');
        }
        return fromDevice;
    }

    private async keysMatch(
        key1: CryptoKey,
        key2: CryptoKey
    ): Promise<boolean> {
        try {
            const testData = 'verification';
            const testBytes = new TextEncoder().encode(testData);
            const iv = new Uint8Array(12); // All zeros for test

            const encrypted1 = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key1,
                testBytes
            );

            const encrypted2 = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key2,
                testBytes
            );

            return this.arraysEqual(
                new Uint8Array(encrypted1),
                new Uint8Array(encrypted2)
            );
        } catch (error) {
            // If either key fails encryption, they don't match
            return false;
        }
    }

    private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}
