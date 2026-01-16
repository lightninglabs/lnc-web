import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
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

// Mock strategy constructors
vi.mock('./passwordStrategy', () => ({
  PasswordStrategy: vi.fn().mockImplementation(() => mockPasswordStrategy)
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
      // Cast to any since 'passkey' is not a valid UnlockMethod yet
      expect(strategyManager.getStrategy('passkey' as any)).toBeUndefined();
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
  });

  describe('preferredMethod', () => {
    beforeEach(() => {
      strategyManager = new StrategyManager(baseConfig);
    });

    it('should return password as the preferred method', () => {
      const method = strategyManager.preferredMethod;

      expect(method).toBe('password');
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
