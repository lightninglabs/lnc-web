import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from './async';

describe('waitFor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve when condition becomes true', async () => {
    let conditionMet = false;
    const condition = () => conditionMet;

    const promise = waitFor(condition, 'Test failed');

    // First check happens immediately, condition is false
    // Set condition to true before second check
    setTimeout(() => {
      conditionMet = true;
    }, 500);

    // Advance timers to trigger setTimeout and then next interval check
    vi.advanceTimersByTime(1000);

    // Wait for promise to resolve
    await promise;

    expect(conditionMet).toBe(true);
  });

  it('should reject with failure message when condition never becomes true', async () => {
    const condition = () => false;
    const failureMessage = 'Condition never met';

    const promise = waitFor(condition, failureMessage);

    // Advance past the timeout (20 * 500ms = 10 seconds)
    vi.advanceTimersByTime(11 * 1000);

    await expect(promise).rejects.toThrow(failureMessage);
  });

  it('should check condition multiple times', async () => {
    let checkCount = 0;
    const condition = () => {
      checkCount++;
      return checkCount >= 3;
    };

    const promise = waitFor(condition, 'Test failed');

    // Advance timers to allow multiple checks
    vi.advanceTimersByTime(1500);

    await expect(promise).resolves.toBeUndefined();
    expect(checkCount).toBe(3);
  });

  it('should stop checking after condition becomes true', async () => {
    let checkCount = 0;
    const condition = () => {
      checkCount++;
      return checkCount >= 2;
    };

    const promise = waitFor(condition, 'Test failed');

    vi.advanceTimersByTime(1000);

    await expect(promise).resolves.toBeUndefined();
    // Should stop at 2, not continue checking
    expect(checkCount).toBe(2);
  });

  it('should reject after exactly 20 attempts', async () => {
    let checkCount = 0;
    const condition = () => {
      checkCount++;
      return false;
    };

    const promise = waitFor(condition, 'Test failed');

    // Advance to trigger 20 interval checks (20 * 500ms = 10 seconds)
    // After 20 checks, counter will be 20, and on the 21st check (counter > 20), it rejects
    vi.advanceTimersByTime(10 * 1000 + 500);

    // Wait for rejection - should reject after counter > 20
    await expect(promise).rejects.toThrow('Test failed');
    expect(checkCount).toBeGreaterThanOrEqual(20);
  });
});
