import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
import { PasskeyStrategy } from './passkeyStrategy';
import { PasswordStrategy } from './passwordStrategy';
import { StrategyManager } from './strategyManager';

// Mock password strategy
const mockPasswordStrategy = {
  method: 'password',
  isSupported: true,
  isUnlocked: false,
  hasAnyCredentials: false,
  hasStoredAuthData: vi.fn(),
  clear: vi.fn()
};

// Mock passkey strategy
const mockPasskeyStrategy = {
  method: 'passkey',
  isSupported: true,
  isUnlocked: false,
  hasAnyCredentials: false,
  hasStoredAuthData: vi.fn(),
  clear: vi.fn()
};

// Mock strategy constructors
vi.mock('./passwordStrategy', () => ({
  PasswordStrategy: vi.fn().mockImplementation(() => mockPasswordStrategy)
}));

vi.mock('./passkeyStrategy', () => ({
  PasskeyStrategy: vi.fn().mockImplementation(() => mockPasskeyStrategy)
}));

// Mock log methods
vi.spyOn(log, 'info').mockImplementation(() => {});

describe('StrategyManager', () => {
  let strategyManager: StrategyManager;
  const baseConfig = {
    namespace: 'test-namespace'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock defaults
    mockPasswordStrategy.isSupported = true;
    mockPasswordStrategy.isUnlocked = false;
    mockPasswordStrategy.hasAnyCredentials = false;
    mockPasswordStrategy.hasStoredAuthData.mockReturnValue(false);
    mockPasskeyStrategy.isSupported = true;
    mockPasskeyStrategy.isUnlocked = false;
    mockPasskeyStrategy.hasAnyCredentials = false;
    mockPasskeyStrategy.hasStoredAuthData.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should register password strategy by default', () => {
      strategyManager = new StrategyManager(baseConfig);

      expect(PasswordStrategy).toHaveBeenCalledWith('test-namespace');
      expect(strategyManager.getStrategy('password')).toBe(
        mockPasswordStrategy
      );
    });

    it('should use default namespace when not provided', () => {
      strategyManager = new StrategyManager({});

      expect(PasswordStrategy).toHaveBeenCalledWith('default');
    });

    it('should log registered strategies', () => {
      const spy = vi.spyOn(log, 'info');

      strategyManager = new StrategyManager(baseConfig);

      expect(spy).toHaveBeenCalledWith(
        '[StrategyManager] Registered strategies: password'
      );
    });

    it('should register passkey strategy when allowPasskeys is true', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true
      });

      expect(PasskeyStrategy).toHaveBeenCalledWith(
        'test-namespace',
        'LNC User (test-namespace)'
      );
      expect(strategyManager.getStrategy('passkey')).toBe(mockPasskeyStrategy);
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
  });

  describe('getStrategy()', () => {
    beforeEach(() => {
      strategyManager = new StrategyManager(baseConfig);
    });

    it('should return strategy by method', () => {
      expect(strategyManager.getStrategy('password')).toBe(
        mockPasswordStrategy
      );
    });

    it('should return undefined for unregistered method', () => {
      expect(strategyManager.getStrategy('passkey')).toBeUndefined();
    });

    it('should return passkey strategy when registered', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true
      });

      expect(strategyManager.getStrategy('passkey')).toBe(mockPasskeyStrategy);
    });
  });

  describe('getSupportedMethods()', () => {
    beforeEach(() => {
      strategyManager = new StrategyManager(baseConfig);
    });

    it('should return all supported methods', () => {
      mockPasswordStrategy.isSupported = true;

      const methods = strategyManager.supportedMethods;

      expect(methods).toEqual(['password']);
    });

    it('should filter out unsupported methods', () => {
      mockPasswordStrategy.isSupported = false;

      const methods = strategyManager.supportedMethods;

      expect(methods).toEqual([]);
    });

    it('should include passkey when registered and supported', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true
      });
      mockPasswordStrategy.isSupported = true;
      mockPasskeyStrategy.isSupported = true;

      const methods = strategyManager.supportedMethods;

      expect(methods).toEqual(['password', 'passkey']);
    });
  });

  describe('preferredMethod', () => {
    beforeEach(() => {
      strategyManager = new StrategyManager(baseConfig);
    });

    it('should return password when only password has credentials', () => {
      mockPasswordStrategy.hasAnyCredentials = true;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('password');
    });

    it('should return password as default when no credentials exist', () => {
      mockPasswordStrategy.hasAnyCredentials = false;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('password');
    });

    it('should return passkey when passkey has credentials', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true
      });
      mockPasskeyStrategy.hasAnyCredentials = true;
      mockPasswordStrategy.hasAnyCredentials = false;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('passkey');
    });

    it('should prefer passkey over password when both have credentials', () => {
      strategyManager = new StrategyManager({
        ...baseConfig,
        allowPasskeys: true
      });
      mockPasskeyStrategy.hasAnyCredentials = true;
      mockPasswordStrategy.hasAnyCredentials = true;

      const method = strategyManager.preferredMethod;

      expect(method).toBe('passkey');
    });
  });

  describe('hasAnyCredentials', () => {
    beforeEach(() => {
      strategyManager = new StrategyManager(baseConfig);
    });

    it('should return true when password strategy has credentials', () => {
      mockPasswordStrategy.hasAnyCredentials = true;

      const result = strategyManager.hasAnyCredentials;

      expect(result).toBe(true);
    });

    it('should return false when no strategy has credentials', () => {
      mockPasswordStrategy.hasAnyCredentials = false;

      const result = strategyManager.hasAnyCredentials;

      expect(result).toBe(false);
    });
  });

  describe('clearAll()', () => {
    beforeEach(() => {
      strategyManager = new StrategyManager(baseConfig);
    });

    it('should clear all registered strategies', () => {
      strategyManager.clearAll();

      expect(mockPasswordStrategy.clear).toHaveBeenCalled();
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

    it('should log clear operation', () => {
      const spy = vi.spyOn(log, 'info');

      strategyManager.clearAll();

      expect(spy).toHaveBeenCalledWith(
        '[StrategyManager] Cleared all strategies'
      );
    });
  });

  describe('Integration tests', () => {
    it('should handle full strategy lifecycle', () => {
      strategyManager = new StrategyManager(baseConfig);

      // Check initial state
      expect(strategyManager.hasAnyCredentials).toBe(false);
      expect(strategyManager.preferredMethod).toBe('password');

      // Simulate having credentials
      mockPasswordStrategy.hasAnyCredentials = true;
      expect(strategyManager.hasAnyCredentials).toBe(true);

      // Clear all
      strategyManager.clearAll();
      expect(mockPasswordStrategy.clear).toHaveBeenCalled();
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
