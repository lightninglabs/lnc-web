import SessionManager from '../sessions/sessionManager';
import { LncConfig, UnlockMethod } from '../types/lnc';
import { AuthStrategy } from './authStrategy';
import { PasskeyStrategy } from './passkeyStrategy';
import { PasswordStrategy } from './passwordStrategy';
import { SessionStrategy } from './sessionStrategy';

/**
 * Manages authentication strategies and their lifecycle.
 * Handles strategy registration, lookup, and coordination.
 */
export class StrategyManager {
    private strategies = new Map<UnlockMethod, AuthStrategy>();

    constructor(config: LncConfig, sessionManager?: SessionManager) {
        this.registerStrategies(config, sessionManager);
    }

    /**
     * Register authentication strategies based on configuration
     */
    private registerStrategies(
        config: LncConfig,
        sessionManager?: SessionManager
    ): void {
        const namespace = config.namespace || 'default';

        // Always register password strategy (available in all configurations)
        this.strategies.set('password', new PasswordStrategy(namespace));

        // Register passkey strategy if passkeys are enabled
        if (config.allowPasskeys) {
            this.strategies.set('passkey', new PasskeyStrategy(namespace));
        }

        // Register session strategy if sessions are available
        if (sessionManager) {
            this.strategies.set('session', new SessionStrategy(sessionManager));
        }

        console.log(
            `[StrategyManager] Registered strategies: ${Array.from(
                this.strategies.keys()
            ).join(', ')}`
        );
    }

    /**
     * Get a strategy by unlock method
     */
    getStrategy(method: UnlockMethod): AuthStrategy | undefined {
        return this.strategies.get(method);
    }

    /**
     * Get all supported unlock methods
     */
    getSupportedMethods(): UnlockMethod[] {
        const methods: UnlockMethod[] = [];

        Array.from(this.strategies.entries()).forEach(([method, strategy]) => {
            if (strategy.isSupported()) {
                methods.push(method);
            }
        });

        return methods;
    }

    /**
     * Determine the preferred unlock method based on availability and priority
     */
    getPreferredMethod(): 'password' | 'passkey' | 'session' {
        // Check for active session first
        const sessionStrategy = this.strategies.get('session');
        if (sessionStrategy?.isUnlocked()) {
            return 'session';
        }

        // Prefer passkey if available and has stored data
        const passkeyStrategy = this.strategies.get('passkey');
        if (
            passkeyStrategy?.isSupported() &&
            passkeyStrategy.hasStoredAuthData?.()
        ) {
            return 'passkey';
        }

        return 'password';
    }

    /**
     * Check if any strategy has stored credentials
     */
    hasAnyCredentials(): boolean {
        return Array.from(this.strategies.values()).some((strategy) =>
            strategy.hasAnyCredentials()
        );
    }

    /**
     * Clear all strategies
     */
    clearAll(): void {
        Array.from(this.strategies.values()).forEach((strategy) => {
            strategy.clear();
        });
        console.log('[StrategyManager] Cleared all strategies');
    }

    /**
     * Get all registered strategies (for iteration)
     */
    getAllStrategies(): Map<UnlockMethod, AuthStrategy> {
        return this.strategies;
    }

    /**
     * Check if a specific strategy is supported
     */
    isStrategySupported(method: UnlockMethod): boolean {
        const strategy = this.strategies.get(method);
        return strategy?.isSupported() ?? false;
    }
}
