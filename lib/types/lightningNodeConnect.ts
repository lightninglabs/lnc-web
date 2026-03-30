import { BaseConnectionConfig } from './baseConnection';

/**
 * Configuration options for session-based credential management.
 *
 * All duration fields use milliseconds for consistency.
 */
export interface SessionConfig {
  /** Session duration in milliseconds (default: 24 hours). Must be a finite positive number. */
  sessionDurationMs?: number;
  /** Enable automatic session refresh based on activity (default: true). */
  enableActivityRefresh?: boolean;
  /** Maximum number of refreshes per session (default: 10). Must be a non-negative integer. */
  maxRefreshes?: number;
  /**
   * Absolute maximum session age in milliseconds (default: 7 days).
   * Must be a finite positive number and >= sessionDurationMs.
   */
  maxSessionAgeMs?: number;
}

/**
 * Authentication information returned by getAuthenticationInfo()
 */
export interface AuthenticationInfo {
  /** True if any authentication method has been successfully applied */
  isUnlocked: boolean;
  /** True if any long-term credentials are stored */
  hasStoredCredentials: boolean;
  /** True if a valid session exists for passwordless login */
  hasActiveSession: boolean;
  /** Remaining session time in milliseconds */
  sessionTimeRemaining: number;
  /** True if passkeys are supported in this environment */
  supportsPasskeys: boolean;
  /** True if a passkey credential is available */
  hasPasskey: boolean;
  /** The recommended unlock method based on current state */
  preferredUnlockMethod: UnlockMethod;
  /** The stored passkey credential ID, if any. Pass to pair() to reuse across namespaces. */
  passkeyCredentialId?: string;
}

/**
 * Available unlock methods
 */
export type UnlockMethod = 'password' | 'passkey' | 'session';

/**
 * Unlock options for password-based authentication.
 */
export interface PasswordUnlockOptions {
  method: 'password';
  password: string;
  salt?: string;
  cipher?: string;
}

/**
 * Unlock options for passkey-based authentication.
 */
export interface PasskeyUnlockOptions {
  method: 'passkey';
  createIfMissing?: boolean;
  credentialId?: string;
}

/**
 * Unlock options for session-based authentication.
 */
export interface SessionUnlockOptions {
  method: 'session';
}

/**
 * Unlock options for different authentication methods.
 */
export type UnlockOptions =
  | PasswordUnlockOptions
  | PasskeyUnlockOptions
  | SessionUnlockOptions;

/**
 * Options for persisting credentials after a successful pairing. Used by
 * pair() to combine connection and persistence into a single call.
 */
export type PersistOptions = PasswordUnlockOptions | PasskeyUnlockOptions;

/**
 * Options for clearing credentials
 */
export interface ClearOptions {
  /** clear the short-term credentials saved in session storage (default: true) */
  session?: boolean;
  /** clear the long-term pairing credentials saved in local storage (default: false) */
  persisted?: boolean;
}

/**
 * Modern configuration for the LightningNodeConnect class.
 */
export interface LightningNodeConnectConfig extends BaseConnectionConfig {
  /**
   * When true, enables passkey-based authentication for credential encryption.
   * Requires WebAuthn support in the browser.
   * Default is true.
   */
  allowPasskeys?: boolean;
  /**
   * Enable session-based authentication. When enabled, credentials are stored
   * in sessionStorage for passwordless login during the browser session.
   * Default is true.
   */
  enableSessions?: boolean;
  /**
   * Display name shown to user during passkey creation.
   * Used as the user.displayName in the WebAuthn credential.
   * Defaults to "LNC User ({namespace})" if not provided.
   */
  passkeyDisplayName?: string;
  /**
   * Session configuration options. Only used when enableSessions is true.
   * See {@link SessionConfig} for available options and defaults.
   */
  session?: SessionConfig;
}
