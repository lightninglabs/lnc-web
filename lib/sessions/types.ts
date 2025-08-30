export interface SessionCredentials {
    localKey: string;
    remoteKey: string;
    pairingPhrase: string;
    serverHost: string;
    expiresAt: number;
}

export interface WrappedKey {
    keyB64: string;
    ivB64: string;
}

export interface SessionData {
    sessionId: string;
    deviceFingerprint: string;
    createdAt: number;
    expiresAt: number;
    refreshCount: number;
    encryptedCredentials: string;
    credentialsIV: string;
    device: WrappedKey;
    origin: WrappedKey;
}
