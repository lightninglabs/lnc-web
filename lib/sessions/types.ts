export interface SessionCredentials {
  localKey: string;
  remoteKey: string;
  pairingPhrase: string;
  serverHost: string;
}

export interface SessionData {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  refreshCount: number;
  credentials: SessionCredentials;
}
