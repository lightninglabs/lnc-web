import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SessionManager from '../sessions/sessionManager';
import { PasskeyStrategy } from './passkeyStrategy';
import { PasswordStrategy } from './passwordStrategy';
import { SessionStrategy } from './sessionStrategy';
import { StrategyManager } from './strategyManager';

// Mock strategies
const mockPasswordStrategy = {
    method: 'password',
    isSupported: vi.fn(),
    isUnlocked: vi.fn(),
    hasAnyCredentials: vi.fn(),
    hasStoredAuthData: vi.fn(),
    clear: vi.fn()
};

const mockPasskeyStrategy = {
    method: 'passkey',
    isSupported: vi.fn(),
    isUnlocked: vi.fn(),
    hasAnyCredentials: vi.fn(),
    hasStoredAuthData: vi.fn(),
    clear: vi.fn()
};

const mockSessionStrategy = {
    method: 'session',
    isSupported: vi.fn(),
    isUnlocked: vi.fn(),
    hasAnyCredentials: vi.fn(),
    hasStoredAuthData: vi.fn(),
    clear: vi.fn()
};

const mockSessionManager = {
    tryRestore: vi.fn(),
    hasActiveSession: vi.fn(),
    clearSession: vi.fn()
};

const sessionManagerMock = mockSessionManager as unknown as SessionManager;

// Mock strategy constructors
vi.mock('./passwordStrategy', () => ({
    PasswordStrategy: vi.fn().mockImplementation(() => mockPasswordStrategy)
}));

vi.mock('./passkeyStrategy', () => ({
    PasskeyStrategy: vi.fn().mockImplementation(() => mockPasskeyStrategy)
}));

vi.mock('./sessionStrategy', () => ({
    SessionStrategy: vi.fn().mockImplementation(() => mockSessionStrategy)
}));

vi.mock('../sessions/sessionManager', () => ({
    default: vi.fn().mockImplementation(() => mockSessionManager)
}));

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});

describe('StrategyManager', () => {
    let strategyManager: StrategyManager;
    const baseConfig = {
        namespace: 'test-namespace',
        allowPasskeys: true,
        passkeyDisplayName: 'Test App'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock defaults
        mockPasswordStrategy.isSupported.mockReturnValue(true);
        mockPasswordStrategy.isUnlocked.mockReturnValue(false);
        mockPasswordStrategy.hasAnyCredentials.mockReturnValue(false);
        mockPasswordStrategy.hasStoredAuthData.mockReturnValue(false);

        mockPasskeyStrategy.isSupported.mockReturnValue(true);
        mockPasskeyStrategy.isUnlocked.mockReturnValue(false);
        mockPasskeyStrategy.hasAnyCredentials.mockReturnValue(false);
        mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(false);

        mockSessionStrategy.isSupported.mockReturnValue(true);
        mockSessionStrategy.isUnlocked.mockReturnValue(false);
        mockSessionStrategy.hasAnyCredentials.mockReturnValue(false);
        mockSessionStrategy.hasStoredAuthData.mockReturnValue(false);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should register password strategy by default', () => {
            const config = { ...baseConfig, allowPasskeys: false };
            strategyManager = new StrategyManager(config);

            expect(PasswordStrategy).toHaveBeenCalledWith('test-namespace');
            expect(strategyManager.getStrategy('password')).toBe(
                mockPasswordStrategy
            );
        });

        it('should register passkey strategy when enabled', () => {
            const config = { ...baseConfig, allowPasskeys: true };
            strategyManager = new StrategyManager(config);

            expect(PasskeyStrategy).toHaveBeenCalledWith(
                'test-namespace',
                'Test App'
            );
            expect(strategyManager.getStrategy('passkey')).toBe(
                mockPasskeyStrategy
            );
        });

        it('should not register passkey strategy when disabled', () => {
            const config = { ...baseConfig, allowPasskeys: false };
            strategyManager = new StrategyManager(config);

            expect(PasskeyStrategy).not.toHaveBeenCalled();
            expect(strategyManager.getStrategy('passkey')).toBeUndefined();
        });

        it('should register session strategy when session manager provided', () => {
            const config = baseConfig;
            const sessionManager = sessionManagerMock;
            strategyManager = new StrategyManager(config, sessionManager);

            expect(SessionStrategy).toHaveBeenCalledWith(sessionManager);
            expect(strategyManager.getStrategy('session')).toBe(
                mockSessionStrategy
            );
        });

        it('should not register session strategy when no session manager', () => {
            const config = baseConfig;
            strategyManager = new StrategyManager(config);

            expect(SessionStrategy).not.toHaveBeenCalled();
            expect(strategyManager.getStrategy('session')).toBeUndefined();
        });

        it('should use default namespace when not provided', () => {
            const config = { allowPasskeys: true };
            strategyManager = new StrategyManager(config);

            expect(PasswordStrategy).toHaveBeenCalledWith('default');
        });

        it('should use default display name when not provided', () => {
            const config = { namespace: 'test', allowPasskeys: true };
            strategyManager = new StrategyManager(config);

            expect(PasskeyStrategy).toHaveBeenCalledWith(
                'test',
                'LNC User (test)'
            );
        });

        it('should log registered strategies', () => {
            const config = { ...baseConfig, allowPasskeys: true };
            const sessionManager = sessionManagerMock;
            const consoleSpy = vi.spyOn(console, 'log');

            strategyManager = new StrategyManager(config, sessionManager);

            expect(consoleSpy).toHaveBeenCalledWith(
                '[StrategyManager] Registered strategies: password, passkey, session'
            );
        });
    });

    describe('getStrategy()', () => {
        beforeEach(() => {
            strategyManager = new StrategyManager(
                baseConfig,
                sessionManagerMock
            );
        });

        it('should return strategy by method', () => {
            expect(strategyManager.getStrategy('password')).toBe(
                mockPasswordStrategy
            );
            expect(strategyManager.getStrategy('passkey')).toBe(
                mockPasskeyStrategy
            );
            expect(strategyManager.getStrategy('session')).toBe(
                mockSessionStrategy
            );
        });

        it('should return undefined for unregistered method', () => {
            expect(
                strategyManager.getStrategy('unknown' as any)
            ).toBeUndefined();
        });
    });

    describe('getSupportedMethods()', () => {
        beforeEach(() => {
            strategyManager = new StrategyManager(
                baseConfig,
                sessionManagerMock
            );
        });

        it('should return all supported methods', () => {
            mockPasswordStrategy.isSupported.mockReturnValue(true);
            mockPasskeyStrategy.isSupported.mockReturnValue(true);
            mockSessionStrategy.isSupported.mockReturnValue(true);

            const methods = strategyManager.getSupportedMethods();

            expect(methods).toEqual(['password', 'passkey', 'session']);
        });

        it('should filter out unsupported methods', () => {
            mockPasswordStrategy.isSupported.mockReturnValue(true);
            mockPasskeyStrategy.isSupported.mockReturnValue(false);
            mockSessionStrategy.isSupported.mockReturnValue(true);

            const methods = strategyManager.getSupportedMethods();

            expect(methods).toEqual(['password', 'session']);
        });

        it('should return empty array when no strategies are supported', () => {
            mockPasswordStrategy.isSupported.mockReturnValue(false);
            mockPasskeyStrategy.isSupported.mockReturnValue(false);
            mockSessionStrategy.isSupported.mockReturnValue(false);

            const methods = strategyManager.getSupportedMethods();

            expect(methods).toEqual([]);
        });
    });

    describe('getPreferredMethod()', () => {
        beforeEach(() => {
            strategyManager = new StrategyManager(
                baseConfig,
                sessionManagerMock
            );
        });

        it('should prefer session when active', () => {
            mockSessionStrategy.isUnlocked.mockReturnValue(true);

            const method = strategyManager.getPreferredMethod();

            expect(method).toBe('session');
        });

        it('should prefer passkey when session not active and passkey has stored data', () => {
            mockSessionStrategy.isUnlocked.mockReturnValue(false);
            mockPasskeyStrategy.isSupported.mockReturnValue(true);
            mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(true);

            const method = strategyManager.getPreferredMethod();

            expect(method).toBe('passkey');
        });

        it('should default to password when no preferred methods available', () => {
            mockSessionStrategy.isUnlocked.mockReturnValue(false);
            mockPasskeyStrategy.isSupported.mockReturnValue(false);
            mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(false);

            const method = strategyManager.getPreferredMethod();

            expect(method).toBe('password');
        });

        it('should default to password when passkey has no stored data', () => {
            mockSessionStrategy.isUnlocked.mockReturnValue(false);
            mockPasskeyStrategy.isSupported.mockReturnValue(true);
            mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(false);

            const method = strategyManager.getPreferredMethod();

            expect(method).toBe('password');
        });

        it('should default to password when passkey not supported', () => {
            mockSessionStrategy.isUnlocked.mockReturnValue(false);
            mockPasskeyStrategy.isSupported.mockReturnValue(false);

            const method = strategyManager.getPreferredMethod();

            expect(method).toBe('password');
        });
    });

    describe('hasAnyCredentials()', () => {
        beforeEach(() => {
            strategyManager = new StrategyManager(
                baseConfig,
                sessionManagerMock
            );
        });

        it('should return true when any strategy has credentials', () => {
            mockPasswordStrategy.hasAnyCredentials.mockReturnValue(false);
            mockPasskeyStrategy.hasAnyCredentials.mockReturnValue(true);
            mockSessionStrategy.hasAnyCredentials.mockReturnValue(false);

            const result = strategyManager.hasAnyCredentials();

            expect(result).toBe(true);
        });

        it('should return false when no strategy has credentials', () => {
            mockPasswordStrategy.hasAnyCredentials.mockReturnValue(false);
            mockPasskeyStrategy.hasAnyCredentials.mockReturnValue(false);
            mockSessionStrategy.hasAnyCredentials.mockReturnValue(false);

            const result = strategyManager.hasAnyCredentials();

            expect(result).toBe(false);
        });

        it('should return true when password strategy has credentials', () => {
            mockPasswordStrategy.hasAnyCredentials.mockReturnValue(true);

            const result = strategyManager.hasAnyCredentials();

            expect(result).toBe(true);
        });

        it('should return true when session strategy has credentials', () => {
            mockSessionStrategy.hasAnyCredentials.mockReturnValue(true);

            const result = strategyManager.hasAnyCredentials();

            expect(result).toBe(true);
        });
    });

    describe('clearAll()', () => {
        beforeEach(() => {
            strategyManager = new StrategyManager(
                baseConfig,
                sessionManagerMock
            );
        });

        it('should clear all registered strategies', () => {
            strategyManager.clearAll();

            expect(mockPasswordStrategy.clear).toHaveBeenCalled();
            expect(mockPasskeyStrategy.clear).toHaveBeenCalled();
            expect(mockSessionStrategy.clear).toHaveBeenCalled();
        });

        it('should log clear operation', () => {
            const consoleSpy = vi.spyOn(console, 'log');

            strategyManager.clearAll();

            expect(consoleSpy).toHaveBeenCalledWith(
                '[StrategyManager] Cleared all strategies'
            );
        });
    });

    describe('getAllStrategies()', () => {
        beforeEach(() => {
            strategyManager = new StrategyManager(
                baseConfig,
                sessionManagerMock
            );
        });

        it('should return map of all registered strategies', () => {
            const strategies = strategyManager.getAllStrategies();

            expect(strategies).toBeInstanceOf(Map);
            expect(strategies.get('password')).toBe(mockPasswordStrategy);
            expect(strategies.get('passkey')).toBe(mockPasskeyStrategy);
            expect(strategies.get('session')).toBe(mockSessionStrategy);
        });

        it('should return the same map instance', () => {
            const strategies1 = strategyManager.getAllStrategies();
            const strategies2 = strategyManager.getAllStrategies();

            expect(strategies1).toBe(strategies2); // Returns the same Map instance
            expect(strategies1.get('password')).toBe(mockPasswordStrategy);
        });
    });

    describe('isStrategySupported()', () => {
        beforeEach(() => {
            strategyManager = new StrategyManager(
                baseConfig,
                sessionManagerMock
            );
        });

        it('should return true for supported strategies', () => {
            mockPasswordStrategy.isSupported.mockReturnValue(true);
            mockPasskeyStrategy.isSupported.mockReturnValue(true);
            mockSessionStrategy.isSupported.mockReturnValue(true);

            expect(strategyManager.isStrategySupported('password')).toBe(true);
            expect(strategyManager.isStrategySupported('passkey')).toBe(true);
            expect(strategyManager.isStrategySupported('session')).toBe(true);
        });

        it('should return false for unsupported strategies', () => {
            mockPasswordStrategy.isSupported.mockReturnValue(false);

            expect(strategyManager.isStrategySupported('password')).toBe(false);
        });

        it('should return false for unregistered methods', () => {
            expect(strategyManager.isStrategySupported('unknown' as any)).toBe(
                false
            );
        });
    });

    describe('Integration tests', () => {
        it('should handle configuration without passkeys', () => {
            const config = { namespace: 'test', allowPasskeys: false };
            strategyManager = new StrategyManager(config);

            expect(strategyManager.getStrategy('password')).toBeDefined();
            expect(strategyManager.getStrategy('passkey')).toBeUndefined();
            expect(strategyManager.getSupportedMethods()).toEqual(['password']);
            expect(strategyManager.getPreferredMethod()).toBe('password');
        });

        it('should handle configuration without session manager', () => {
            const config = { ...baseConfig, allowPasskeys: true };
            strategyManager = new StrategyManager(config);

            expect(strategyManager.getStrategy('session')).toBeUndefined();
            expect(strategyManager.getSupportedMethods()).toEqual([
                'password',
                'passkey'
            ]);
        });

        it('should handle full strategy lifecycle', () => {
            strategyManager = new StrategyManager(
                baseConfig,
                sessionManagerMock
            );

            // Check initial state
            expect(strategyManager.hasAnyCredentials()).toBe(false);
            expect(strategyManager.getPreferredMethod()).toBe('password');

            // Simulate passkey with stored data
            mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(true);

            expect(strategyManager.getPreferredMethod()).toBe('passkey');

            // Simulate active session
            mockSessionStrategy.isUnlocked.mockReturnValue(true);

            expect(strategyManager.getPreferredMethod()).toBe('session');

            // Clear all
            strategyManager.clearAll();

            expect(mockPasswordStrategy.clear).toHaveBeenCalled();
            expect(mockPasskeyStrategy.clear).toHaveBeenCalled();
            expect(mockSessionStrategy.clear).toHaveBeenCalled();
        });
    });
});
