import { LncConfig, UnlockMethod } from '../types/lnc';
import { log } from '../util/log';
import { AuthStrategy } from './authStrategy';
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
   * Determine the preferred unlock method based on availability and priority.
   * Note: Session and passkey preference logic will be added in later PRs.
   */
  get preferredMethod(): UnlockMethod {
    // For now, only password is available. Session and passkey will be added in later PRs.
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
   * Note: Only password strategy is available in this PR.
   * Passkey and session strategies are added in later PRs.
   */
  private registerStrategies(config: LncConfig): void {
    const namespace = config.namespace || 'default';

    // Always register password strategy (available in all configurations)
    this.strategies.set('password', new PasswordStrategy(namespace));

    log.info(
      `[StrategyManager] Registered strategies: ${Array.from(
        this.strategies.keys()
      ).join(', ')}`
    );
  }
}
