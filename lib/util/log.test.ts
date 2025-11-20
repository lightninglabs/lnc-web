import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actionLog, grpcLog, log, Logger, LogLevel, wasmLog } from './log';

// Create a reference to the globalThis object with additional property types
// needed for testing
const testGlobal = globalThis as typeof globalThis & {
  lastDebugCall: {
    namespace: string;
    message: string;
    args: any[];
  };
};

const resetTestGlobal = () => {
  testGlobal.lastDebugCall = { namespace: '', message: '', args: [] };
};

// Mock the debug module
vi.mock('debug', () => ({
  default: vi.fn((namespace: string) =>
    vi.fn((message: string, ...args: any[]) => {
      // Store the last call for verification
      testGlobal.lastDebugCall = { namespace, message, args };
    })
  )
}));

describe('Logging System', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset debug call tracking
    resetTestGlobal();
  });

  describe('LogLevel enum', () => {
    it('should have correct enum values', () => {
      expect(LogLevel.debug).toBe(1);
      expect(LogLevel.info).toBe(2);
      expect(LogLevel.warn).toBe(3);
      expect(LogLevel.error).toBe(4);
      expect(LogLevel.none).toBe(5);
    });

    it('should have all expected levels defined', () => {
      // In TypeScript enums, Object.values returns both keys and values
      const numericValues = Object.values(LogLevel).filter(
        (v) => typeof v === 'number'
      );
      expect(numericValues).toHaveLength(5);
      expect(numericValues).toContain(1); // debug
      expect(numericValues).toContain(2); // info
      expect(numericValues).toContain(3); // warn
      expect(numericValues).toContain(4); // error
      expect(numericValues).toContain(5); // none
    });
  });

  describe('Logger constructor', () => {
    it('should create logger instance with correct level', () => {
      const logger = new Logger(LogLevel.info, 'test');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should accept different log levels', () => {
      const debugLogger = new Logger(LogLevel.debug, 'debug-test');
      const errorLogger = new Logger(LogLevel.error, 'error-test');
      const noneLogger = new Logger(LogLevel.none, 'none-test');

      expect(debugLogger).toBeDefined();
      expect(errorLogger).toBeDefined();
      expect(noneLogger).toBeDefined();
    });

    it('should set namespace correctly', () => {
      const namespace = 'test-namespace';
      const logger = new Logger(LogLevel.debug, namespace);

      // The namespace should be passed to debug
      expect(logger).toBeDefined();
    });
  });

  describe('Logger.fromEnv', () => {
    it('should default to none level when no localStorage', () => {
      // Remove localStorage
      const originalLocalStorage = globalThis.localStorage;
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true
      });

      const logger = Logger.fromEnv('test');
      expect(logger).toBeInstanceOf(Logger);

      // Restore localStorage
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    });

    it('should default to none level when localStorage exists but no debug key', () => {
      const logger = Logger.fromEnv('test');
      expect(logger).toBeInstanceOf(Logger);
      expect(logger.level).toBe(LogLevel.none);
    });

    it('should use debug level when debug key exists in localStorage', () => {
      localStorage.setItem('debug', 'test:*');

      const logger = Logger.fromEnv('test');
      expect(logger.level).toBe(LogLevel.debug);
    });

    it('should parse debug-level from localStorage', () => {
      localStorage.setItem('debug', 'test:*');
      localStorage.setItem('debug-level', 'info');

      const logger = Logger.fromEnv('test');
      expect(logger.level).toBe(LogLevel.info);
    });

    it('should default to debug level when debug-level is not set', () => {
      localStorage.setItem('debug', 'test:*');

      const logger = Logger.fromEnv('test');
      expect(logger.level).toBe(LogLevel.debug);
    });
  });

  describe('Logger logging methods', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger(LogLevel.debug, 'test');
    });

    describe('debug method', () => {
      it('should log debug messages when level allows', () => {
        logger.debug('test message');
        expect(testGlobal.lastDebugCall).toBeTruthy();
        expect(testGlobal.lastDebugCall.message).toContain('[debug]');
        expect(testGlobal.lastDebugCall.message).toContain('test message');
      });

      it('should handle additional arguments', () => {
        const arg1 = { key: 'value' };
        const arg2 = [1, 2, 3];
        logger.debug('test message', arg1, arg2);

        expect(testGlobal.lastDebugCall).toBeTruthy();
        expect(testGlobal.lastDebugCall.args).toContain(arg1);
        expect(testGlobal.lastDebugCall.args).toContain(arg2);
      });
    });
  });

  describe('Log level filtering', () => {
    it('should only log messages at or above the configured level', () => {
      const infoLogger = new Logger(LogLevel.info, 'test');

      infoLogger.debug('debug message');
      expect(testGlobal.lastDebugCall.message).toBe('');

      infoLogger.info('info message');
      expect(testGlobal.lastDebugCall.message).toBe('[info] info message');

      resetTestGlobal();

      infoLogger.warn('warn message');
      expect(testGlobal.lastDebugCall.message).toBe('[warn] warn message');

      resetTestGlobal();

      infoLogger.error('error message');
      expect(testGlobal.lastDebugCall.message).toBe('[error] error message');
    });
  });

  describe('Pre-configured logger instances', () => {
    it('should export main logger', () => {
      expect(log).toBeInstanceOf(Logger);
    });

    it('should export grpc logger', () => {
      expect(grpcLog).toBeInstanceOf(Logger);
    });

    it('should export wasm logger', () => {
      expect(wasmLog).toBeInstanceOf(Logger);
    });

    it('should export action logger', () => {
      expect(actionLog).toBeInstanceOf(Logger);
    });
  });

  describe('Environment detection edge cases', () => {
    it('should handle null localStorage gracefully', () => {
      const originalLocalStorage = localStorage;
      Object.defineProperty(globalThis, 'localStorage', {
        value: null,
        writable: true
      });

      const logger = Logger.fromEnv('test');
      expect(logger).toBeInstanceOf(Logger);

      // Restore localStorage
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    });

    it('should handle empty debug-level value', () => {
      localStorage.setItem('debug', 'test:*');
      localStorage.setItem('debug-level', '');

      const logger = Logger.fromEnv('test');
      expect(logger.level).toBe(LogLevel.debug);
    });
  });

  describe('Multiple logger instances', () => {
    it('should create independent logger instances', () => {
      const logger1 = new Logger(LogLevel.debug, 'namespace1');
      const logger2 = new Logger(LogLevel.info, 'namespace2');

      expect(logger1).not.toBe(logger2);
    });
  });
});
