import { describe, expect, it } from 'vitest';
import SessionRefreshManager from './sessionRefreshManager';
import SessionManager from './sessionManager';

const createManager = () => {
  const sessionManager = new SessionManager('test');
  return new SessionRefreshManager(sessionManager);
};

describe('SessionRefreshManager', () => {
  it('starts and stops tracking', () => {
    const manager = createManager();

    expect(manager.isActive()).toBe(false);

    manager.start();
    expect(manager.isActive()).toBe(true);

    manager.stop();
    expect(manager.isActive()).toBe(false);
  });
});
