import { UnlockMethod, UnlockOptions } from '../types/lnc';
import { EncryptionService } from './encryptionService';

/**
 * Pure passkey-based encryption service using WebAuthn PRF extension.
 * No storage dependencies - just crypto operations.
 */
export class PasskeyEncryptionService implements EncryptionService {
    private isUnlockedState: boolean = false;
    private encryptionKey?: CryptoKey;
    private credentialId?: string;
    private namespace: string;
    private displayName: string;

    constructor(namespace: string, displayName?: string) {
        this.namespace = namespace;
        this.displayName = displayName || `LNC User (${namespace})`;
    }

    async encrypt(data: string): Promise<string> {
        if (!this.isUnlocked() || !this.encryptionKey) {
            throw new Error(
                'Passkey encryption service is locked. Call unlock() first.'
            );
        }

        try {
            const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(data);

            const ciphertext = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encodedData
            );

            // Combine IV and ciphertext
            const combined = new Uint8Array(iv.length + ciphertext.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(ciphertext), iv.length);

            return this.arrayBufferToBase64(combined.buffer);
        } catch (error) {
            throw new Error(
                `Passkey encryption failed: ${(error as Error).message}`
            );
        }
    }

    async decrypt(data: string): Promise<string> {
        if (!this.isUnlocked() || !this.encryptionKey) {
            throw new Error(
                'Passkey encryption service is locked. Call unlock() first.'
            );
        }

        try {
            const combined = this.base64ToArrayBuffer(data);
            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                ciphertext
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            throw new Error(
                `Passkey decryption failed: ${(error as Error).message}`
            );
        }
    }

    async unlock(options: UnlockOptions): Promise<void> {
        if (options.method !== 'passkey') {
            throw new Error(
                'Passkey encryption service requires passkey unlock method'
            );
        }

        try {
            if (options.credentialId && !options.createIfMissing) {
                // Existing passkey authentication
                await this.authenticateWithExistingPasskey(
                    options.credentialId
                );
            } else if (options.createIfMissing) {
                // Create new passkey or authenticate with existing
                if (options.credentialId) {
                    try {
                        await this.authenticateWithExistingPasskey(
                            options.credentialId
                        );
                    } catch {
                        // If existing passkey fails, create new one
                        await this.createNewPasskey();
                    }
                } else {
                    await this.createNewPasskey();
                }
            } else {
                throw new Error(
                    'No passkey credential available and createIfMissing is false'
                );
            }

            this.isUnlockedState = true;
        } catch (error) {
            throw new Error(
                `Passkey unlock failed: ${(error as Error).message}`
            );
        }
    }

    isUnlocked(): boolean {
        return this.isUnlockedState && !!this.encryptionKey;
    }

    lock(): void {
        this.encryptionKey = undefined;
        this.credentialId = undefined;
        this.isUnlockedState = false;
    }

    getMethod(): UnlockMethod {
        return 'passkey';
    }

    canHandle(method: UnlockMethod): boolean {
        return method === 'passkey';
    }

    async hasStoredData(): Promise<boolean> {
        // Passkey encryption itself doesn't store data
        // The repository layer will check for stored credential ID
        return false;
    }

    /**
     * Get the current credential ID (for storage by repository)
     */
    getCredentialId(): string {
        if (!this.credentialId) {
            throw new Error('No credential ID available - unlock first');
        }
        return this.credentialId;
    }

    /**
     * Check if passkeys are supported in the current environment
     */
    static async isSupported(): Promise<boolean> {
        try {
            if (!window.PublicKeyCredential) {
                return false;
            }

            const available =
                await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (!available) {
                return false;
            }

            // Try to check PRF support (this is experimental WebAuthn API)
            // Note: Type cast is necessary as this API is not in standard typings yet
            const extensions =
                (PublicKeyCredential as any).getClientExtensionResults?.() ||
                {};
            return true; // Assume PRF is supported if WebAuthn is available
        } catch {
            return false;
        }
    }

    private async createNewPasskey(): Promise<void> {
        const challenge = this.generateDeterministicChallenge();
        const userId = crypto.getRandomValues(new Uint8Array(16));

        const credential = (await navigator.credentials.create({
            publicKey: {
                challenge: challenge.buffer as ArrayBuffer,
                rp: {
                    name: this.namespace,
                    id: window.location.hostname
                },
                user: {
                    id: userId,
                    name: this.displayName,
                    displayName: this.displayName
                },
                pubKeyCredParams: [
                    { alg: -7, type: 'public-key' }, // ES256
                    { alg: -257, type: 'public-key' } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required',
                    requireResidentKey: true
                },
                extensions: {
                    prf: {
                        eval: {
                            first: challenge.buffer as ArrayBuffer
                        }
                    }
                }
            }
        })) as PublicKeyCredential;

        if (!credential) {
            throw new Error('Failed to create passkey credential');
        }

        this.credentialId = credential.id;
        await this.deriveEncryptionKey(credential, challenge);
    }

    private async authenticateWithExistingPasskey(
        credentialId: string
    ): Promise<void> {
        const challenge = this.generateDeterministicChallenge();

        const credential = (await navigator.credentials.get({
            publicKey: {
                challenge: challenge.buffer as ArrayBuffer,
                allowCredentials: [
                    {
                        type: 'public-key',
                        id: this.base64ToArrayBuffer(
                            credentialId
                        ) as ArrayBuffer
                    }
                ],
                userVerification: 'required',
                extensions: {
                    prf: {
                        eval: {
                            first: challenge.buffer as ArrayBuffer
                        }
                    }
                }
            }
        })) as PublicKeyCredential;

        if (!credential) {
            throw new Error('Failed to authenticate with passkey');
        }

        this.credentialId = credentialId;
        await this.deriveEncryptionKey(credential, challenge);
    }

    private async deriveEncryptionKey(
        credential: PublicKeyCredential,
        challenge: Uint8Array
    ): Promise<void> {
        const response = credential.response as AuthenticatorAssertionResponse;
        const extensions =
            (credential as any).getClientExtensionResults?.() || {};

        if (!extensions.prf?.results?.first) {
            throw new Error('PRF extension not supported or failed');
        }

        const prfOutput = new Uint8Array(extensions.prf.results.first);

        // Derive AES key from PRF output
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            prfOutput,
            'HKDF',
            false,
            ['deriveKey']
        );

        this.encryptionKey = await crypto.subtle.deriveKey(
            {
                name: 'HKDF',
                hash: 'SHA-256',
                salt: new Uint8Array(challenge),
                info: new TextEncoder().encode(this.namespace)
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        return Buffer.from(bytes).toString('base64');
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        // Convert base64url to base64 first if needed
        const base64Standard = base64.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const padded = base64Standard.padEnd(
            base64Standard.length + ((4 - (base64Standard.length % 4)) % 4),
            '='
        );

        const binaryString = Buffer.from(padded, 'base64').toString('binary');
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Generate a deterministic challenge based on the namespace.
     * This ensures the same PRF challenge is used across sessions for consistent key derivation.
     */
    private generateDeterministicChallenge(): Uint8Array {
        const encoder = new TextEncoder();
        const namespaceBytes = encoder.encode(this.namespace);

        // Create a 32-byte challenge by repeating and truncating the namespace hash
        const challenge = new Uint8Array(32);
        for (let i = 0; i < challenge.length; i++) {
            // XOR namespace byte with position to add positional variation.
            // This ensures different values even when namespace repeats
            challenge[i] = namespaceBytes[i % namespaceBytes.length] ^ i % 256;
        }

        return challenge;
    }
}
