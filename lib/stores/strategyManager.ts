import { LncConfig, UnlockMethod } from '../types/lnc';
import { log } from '../util/log';
import { AuthStrategy } from './authStrategy';
import { PasskeyStrategy } from './passkeyStrategy';
import { PasswordStrategy } from './passwordStrategy';

/**
 * Manages authentication strategies and their lifecycle.
 * Handles strategy registration, lookup, and coordination.
 */
export class StrategyManager {
  private strategies = new Map<UnlockMethod, AuthStrategy>();

  constructor(config: LncConfig) {
    this.registerStrategies(config);
  }

  /**
   * Check if any strategy has stored credentials
   */
  get hasAnyCredentials(): boolean {
    return Array.from(this.strategies.values()).some(
      (strategy) => strategy.hasAnyCredentials
    );
  }

  /**
   * Determine the preferred unlock method based on which strategy has stored credentials.
   * Priority: passkey > password (passkey is more secure when available)
   */
  get preferredMethod(): UnlockMethod {
    // Check if passkey strategy has credentials (highest priority)
    const passkeyStrategy = this.strategies.get('passkey');
    if (passkeyStrategy?.hasAnyCredentials) {
      return 'passkey';
    }

    // Check if password strategy has credentials
    const passwordStrategy = this.strategies.get('password');
    if (passwordStrategy?.hasAnyCredentials) {
      return 'password';
    }

    // Default to password if no credentials exist yet
    return 'password';
  }

  /**
   * Get all supported unlock methods
   */
  get supportedMethods(): UnlockMethod[] {
    const methods: UnlockMethod[] = [];

    Array.from(this.strategies.entries()).forEach(([method, strategy]) => {
      if (strategy.isSupported) {
        methods.push(method);
      }
    });

    return methods;
  }

  /**
   * Get a strategy by unlock method
   */
  getStrategy(method: UnlockMethod): AuthStrategy | undefined {
    return this.strategies.get(method);
  }

  /**
   * Clear all strategies
   */
  clearAll(): void {
    this.strategies.forEach((strategy) => strategy.clear());
    log.info('[StrategyManager] Cleared all strategies');
  }

  //
  // Private methods
  //

  /**
   * Register authentication strategies based on configuration.
   * Password strategy is always available.
   * Passkey strategy is registered when allowPasskeys is true.
   * Session strategy will be added in a later PR.
   */
  private registerStrategies(config: LncConfig): void {
    const namespace = config.namespace || 'default';

    // Always register password strategy (available in all configurations)
    this.strategies.set('password', new PasswordStrategy(namespace));

    // Register passkey strategy if enabled
    if (config.allowPasskeys) {
      const displayName =
        config.passkeyDisplayName || `LNC User (${namespace})`;
      this.strategies.set(
        'passkey',
        new PasskeyStrategy(namespace, displayName)
      );
    }

    log.info(
      `[StrategyManager] Registered strategies: ${Array.from(
        this.strategies.keys()
      ).join(', ')}`
    );
  }
}
