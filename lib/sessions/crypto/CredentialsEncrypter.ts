import CryptoService from '../cryptoService';
import { SessionCredentials } from '../types';

export interface EncryptedCredentials {
    credentialsKey: CryptoKey;
    ciphertextB64: string;
    ivB64: string;
}

/**
 * Handles encryption and decryption of session credentials.
 * Single responsibility: credentials encryption/decryption operations.
 */
export class CredentialsEncrypter {
    constructor(private cryptoService: CryptoService) {}

    async encrypt(
        credentials: SessionCredentials
    ): Promise<EncryptedCredentials> {
        const credentialsKey =
            await this.cryptoService.generateRandomCredentialsKey();
        const { ciphertextB64, ivB64 } =
            await this.cryptoService.encryptCredentials(
                credentialsKey,
                JSON.stringify(credentials)
            );
        return { credentialsKey, ciphertextB64, ivB64 };
    }

    async decrypt(
        encrypted: EncryptedCredentials
    ): Promise<SessionCredentials> {
        const json = await this.cryptoService.decryptCredentials(
            encrypted.credentialsKey,
            encrypted.ciphertextB64,
            encrypted.ivB64
        );
        return JSON.parse(json);
    }
}
