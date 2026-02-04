import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
import SessionManager from '../sessions/sessionManager';
import { PasskeyStrategy } from './passkeyStrategy';
import { PasswordStrategy } from './passwordStrategy';
import { SessionStrategy } from './sessionStrategy';
import { StrategyManager } from './strategyManager';

// Mock strategies
const mockPasswordStrategy = {
  method: 'password',
  get isSupported() {
    return mockPasswordStrategy._isSupported;
  },
  _isSupported: true,
  get isUnlocked() {
    return mockPasswordStrategy._isUnlocked;
  },
  _isUnlocked: false,
  get hasAnyCredentials() {
    return mockPasswordStrategy._hasAnyCredentials;
  },
  _hasAnyCredentials: false,
  hasStoredAuthData: vi.fn(),
  clear: vi.fn()
};

const mockPasskeyStrategy = {
  method: 'passkey',
  get isSupported() {
    return mockPasskeyStrategy._isSupported;
  },
  _isSupported: true,
  get isUnlocked() {
    return mockPasskeyStrategy._isUnlocked;
  },
  _isUnlocked: false,
  get hasAnyCredentials() {
    return mockPasskeyStrategy._hasAnyCredentials;
  },
  _hasAnyCredentials: false,
  hasStoredAuthData: vi.fn(),
  clear: vi.fn()
};

const mockSessionStrategy = {
  method: 'session',
  get isSupported() {
    return mockSessionStrategy._isSupported;
  },
  _isSupported: true,
  get isUnlocked() {
    return mockSessionStrategy._isUnlocked;
  },
  _isUnlocked: false,
  get hasAnyCredentials() {
    return mockSessionStrategy._hasAnyCredentials;
  },
  _hasAnyCredentials: false,
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

// Mock log methods
vi.spyOn(log, 'info').mockImplementation(() => {});

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
    mockPasswordStrategy._isSupported = true;
    mockPasswordStrategy._isUnlocked = false;
    mockPasswordStrategy._hasAnyCredentials = false;
    mockPasswordStrategy.hasStoredAuthData.mockReturnValue(false);

    mockPasskeyStrategy._isSupported = true;
    mockPasskeyStrategy._isUnlocked = false;
    mockPasskeyStrategy._hasAnyCredentials = false;
    mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(false);

    mockSessionStrategy._isSupported = true;
    mockSessionStrategy._isUnlocked = false;
    mockSessionStrategy._hasAnyCredentials = false;
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
      expect(strategyManager.getStrategy('passkey')).toBe(mockPasskeyStrategy);
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
      expect(strategyManager.getStrategy('session')).toBe(mockSessionStrategy);
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

      expect(PasskeyStrategy).toHaveBeenCalledWith('test', 'LNC User (test)');
    });

    it('should log registered strategies', () => {
      const config = { ...baseConfig, allowPasskeys: true };
      const sessionManager = sessionManagerMock;
      const spy = vi.spyOn(log, 'info');

      strategyManager = new StrategyManager(config, sessionManager);

      expect(spy).toHaveBeenCalledWith(
        '[StrategyManager] Registered strategies: password, passkey, session'
      );
    });

    it('should register passkey strategy when allowPasskeys is true', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true
      });

      expect(PasskeyStrategy).toHaveBeenCalledWith(
        'test-namespace',
        'Test App'
      );
      expect(strategyManager.getStrategy('passkey')).toBe(mockPasskeyStrategy);
    });

    it('should register session strategy when session manager is provided', () => {
      const sessionManager = {} as never;

      strategyManager = new StrategyManager(baseConfig, sessionManager);

      expect(SessionStrategy).toHaveBeenCalledWith(sessionManager);
      expect(strategyManager.getStrategy('session')).toBe(mockSessionStrategy);
    });

    it('should use custom passkeyDisplayName when provided', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true,
        passkeyDisplayName: 'Custom Display Name'
      });

      expect(PasskeyStrategy).toHaveBeenCalledWith(
        'test-namespace',
        'Custom Display Name'
      );
    });

    it('should not register passkey strategy when allowPasskeys is false', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: false
      });

      expect(PasskeyStrategy).not.toHaveBeenCalled();
      expect(strategyManager.getStrategy('passkey')).toBeUndefined();
    });

    it('should log both strategies when passkeys enabled', () => {
      const spy = vi.spyOn(log, 'info');

      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true
      });

      expect(spy).toHaveBeenCalledWith(
        '[StrategyManager] Registered strategies: password, passkey'
      );
    });

    it('should log session when session manager is provided', () => {
      const spy = vi.spyOn(log, 'info');
      const sessionManager = {} as never;

      strategyManager = new StrategyManager(baseConfig, sessionManager);

      expect(spy).toHaveBeenCalledWith(
        '[StrategyManager] Registered strategies: password, passkey, session'
      );
    });
  });

  describe('getStrategy()', () => {
    beforeEach(() => {
      strategyManager = new StrategyManager(baseConfig, sessionManagerMock);
    });

    it('should return strategy by method', () => {
      expect(strategyManager.getStrategy('password')).toBe(
        mockPasswordStrategy
      );
      expect(strategyManager.getStrategy('passkey')).toBe(mockPasskeyStrategy);
      expect(strategyManager.getStrategy('session')).toBe(mockSessionStrategy);
    });

    it('should return undefined for unregistered method', () => {
      expect(strategyManager.getStrategy('unknown' as any)).toBeUndefined();
    });
  });

  describe('supportedMethods', () => {
    beforeEach(() => {
      strategyManager = new StrategyManager(baseConfig, sessionManagerMock);
    });

    it('should return all supported methods', () => {
      mockPasswordStrategy._isSupported = true;
      mockPasskeyStrategy._isSupported = true;
      mockSessionStrategy._isSupported = true;

      const methods = strategyManager.supportedMethods;

      expect(methods).toEqual(['password', 'passkey', 'session']);
    });

    it('should filter out unsupported methods', () => {
      mockPasswordStrategy._isSupported = true;
      mockPasskeyStrategy._isSupported = false;
      mockSessionStrategy._isSupported = true;

      const methods = strategyManager.supportedMethods;

      expect(methods).toEqual(['password', 'session']);
    });

    it('should return empty array when no strategies are supported', () => {
      mockPasswordStrategy._isSupported = false;
      mockPasskeyStrategy._isSupported = false;
      mockSessionStrategy._isSupported = false;

      const methods = strategyManager.supportedMethods;

      expect(methods).toEqual([]);
    });

    it('should include passkey when registered and supported', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true
      });
      mockPasswordStrategy._isSupported = true;
      mockPasskeyStrategy._isSupported = true;

      const methods = strategyManager.supportedMethods;

      expect(methods).toEqual(['password', 'passkey']);
    });

    it('should include session when registered and supported', () => {
      const sessionManager = {} as never;
      strategyManager = new StrategyManager(baseConfig, sessionManager);
      mockPasswordStrategy._isSupported = true;
      mockSessionStrategy._isSupported = true;

      const methods = strategyManager.supportedMethods;

      expect(methods).toEqual(['password', 'passkey', 'session']);
    });
  });

  describe('preferredMethod', () => {
    beforeEach(() => {
      strategyManager = new StrategyManager(baseConfig, sessionManagerMock);
    });

    it('should prefer session when active', () => {
      mockSessionStrategy._isUnlocked = true;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('session');
    });

    it('should prefer passkey when session not active and passkey has stored data', () => {
      mockSessionStrategy._isUnlocked = false;
      mockPasskeyStrategy._isSupported = true;
      mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(true);

      const method = strategyManager.preferredMethod;

      expect(method).toBe('passkey');
    });

    it('should default to password when no preferred methods available', () => {
      mockSessionStrategy._isUnlocked = false;
      mockPasskeyStrategy._isSupported = false;
      mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(false);

      const method = strategyManager.preferredMethod;

      expect(method).toBe('password');
    });

    it('should default to password when passkey has no stored data', () => {
      mockSessionStrategy._isUnlocked = false;
      mockPasskeyStrategy._isSupported = true;
      mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(false);

      const method = strategyManager.preferredMethod;

      expect(method).toBe('password');
    });

    it('should default to password when passkey not supported', () => {
      mockSessionStrategy._isUnlocked = false;
      mockPasskeyStrategy._isSupported = false;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('password');
    });

    it('should return password when password strategy has credentials', () => {
      mockSessionStrategy._isUnlocked = false;
      mockSessionStrategy._hasAnyCredentials = false;
      mockPasskeyStrategy._isSupported = false;
      mockPasswordStrategy._hasAnyCredentials = true;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('password');
    });

    it('should return password as default when no credentials exist', () => {
      mockPasswordStrategy._hasAnyCredentials = false;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('password');
    });

    it('should return passkey when passkey has credentials', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true
      });
      mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(true);
      mockPasswordStrategy._hasAnyCredentials = false;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('passkey');
    });

    it('should prefer session when session has credentials', () => {
      const sessionManager = {} as never;
      strategyManager = new StrategyManager(baseConfig, sessionManager);
      mockSessionStrategy._hasAnyCredentials = true;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('session');
    });

    it('should prefer session when session is unlocked', () => {
      const sessionManager = {} as never;
      strategyManager = new StrategyManager(baseConfig, sessionManager);
      mockSessionStrategy._hasAnyCredentials = false;
      mockSessionStrategy._isUnlocked = true;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('session');
    });

    it('should prefer passkey over password when both have credentials', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true
      });
      mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(true);
      mockPasswordStrategy._hasAnyCredentials = true;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('passkey');
    });
  });

  describe('hasAnyCredentials', () => {
    beforeEach(() => {
      strategyManager = new StrategyManager(baseConfig, sessionManagerMock);
    });

    it('should return true when any strategy has credentials', () => {
      mockPasswordStrategy._hasAnyCredentials = false;
      mockPasskeyStrategy._hasAnyCredentials = true;
      mockSessionStrategy._hasAnyCredentials = false;

      const result = strategyManager.hasAnyCredentials;

      expect(result).toBe(true);
    });

    it('should return false when no strategy has credentials', () => {
      mockPasswordStrategy._hasAnyCredentials = false;
      mockPasskeyStrategy._hasAnyCredentials = false;
      mockSessionStrategy._hasAnyCredentials = false;

      const result = strategyManager.hasAnyCredentials;

      expect(result).toBe(false);
    });

    it('should return true when password strategy has credentials', () => {
      mockPasswordStrategy._hasAnyCredentials = true;

      const result = strategyManager.hasAnyCredentials;

      expect(result).toBe(true);
    });

    it('should ignore session credentials when checking persisted state', () => {
      mockPasswordStrategy._hasAnyCredentials = false;
      mockPasskeyStrategy._hasAnyCredentials = false;
      mockSessionStrategy._hasAnyCredentials = true;

      expect(strategyManager.hasAnyCredentials).toBe(false);
    });
  });

  describe('clearAll()', () => {
    beforeEach(() => {
      strategyManager = new StrategyManager(baseConfig, sessionManagerMock);
    });

    it('should clear all registered strategies', () => {
      strategyManager.clearAll();

      expect(mockPasswordStrategy.clear).toHaveBeenCalled();
      expect(mockPasskeyStrategy.clear).toHaveBeenCalled();
      expect(mockSessionStrategy.clear).toHaveBeenCalled();
    });

    it('should clear passkey strategy when registered', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true
      });

      strategyManager.clearAll();

      expect(mockPasswordStrategy.clear).toHaveBeenCalled();
      expect(mockPasskeyStrategy.clear).toHaveBeenCalled();
    });

    it('should clear session strategy when registered', () => {
      const sessionManager = {} as never;
      strategyManager = new StrategyManager(baseConfig, sessionManager);

      strategyManager.clearAll();

      expect(mockPasswordStrategy.clear).toHaveBeenCalled();
      expect(mockSessionStrategy.clear).toHaveBeenCalled();
    });

    it('should log clear operation', () => {
      const spy = vi.spyOn(log, 'info');

      strategyManager.clearAll();

      expect(spy).toHaveBeenCalledWith(
        '[StrategyManager] Cleared all strategies'
      );
    });
  });

  describe('Integration tests', () => {
    it('should handle configuration without passkeys', () => {
      const config = { namespace: 'test', allowPasskeys: false };
      strategyManager = new StrategyManager(config);

      expect(strategyManager.getStrategy('password')).toBeDefined();
      expect(strategyManager.getStrategy('passkey')).toBeUndefined();
      expect(strategyManager.supportedMethods).toEqual(['password']);
      expect(strategyManager.preferredMethod).toBe('password');
    });

    it('should handle configuration without session manager', () => {
      const config = { ...baseConfig, allowPasskeys: true };
      strategyManager = new StrategyManager(config);

      expect(strategyManager.getStrategy('session')).toBeUndefined();
      expect(strategyManager.supportedMethods).toEqual(['password', 'passkey']);
    });

    it('should handle full strategy lifecycle', () => {
      strategyManager = new StrategyManager(baseConfig, sessionManagerMock);

      // Check initial state
      expect(strategyManager.hasAnyCredentials).toBe(false);
      expect(strategyManager.preferredMethod).toBe('password');

      // Simulate passkey with stored data
      mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(true);

      expect(strategyManager.preferredMethod).toBe('passkey');

      // Simulate active session
      mockSessionStrategy._isUnlocked = true;

      expect(strategyManager.preferredMethod).toBe('session');

      // Clear all
      strategyManager.clearAll();

      expect(mockPasswordStrategy.clear).toHaveBeenCalled();
      expect(mockPasskeyStrategy.clear).toHaveBeenCalled();
      expect(mockSessionStrategy.clear).toHaveBeenCalled();
    });

    it('should work with different namespaces', () => {
      const strategyManager1 = new StrategyManager({ namespace: 'namespace1' });
      const strategyManager2 = new StrategyManager({ namespace: 'namespace2' });

      expect(strategyManager1).not.toBe(strategyManager2);
      expect(PasswordStrategy).toHaveBeenCalledWith('namespace1');
      expect(PasswordStrategy).toHaveBeenCalledWith('namespace2');
    });
  });
});
