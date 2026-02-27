import { SessionConfig } from '../types/lnc';
import { log } from '../util/log';

import type SessionManager from './sessionManager';

type SessionManagerDependency = Pick<
  SessionManager,
  'config' | 'sessionTimeRemaining' | 'refreshSession'
>;

/** Maximum consecutive check errors before the manager stops itself. */
const MAX_CONSECUTIVE_ERRORS = 3;

/** Milliseconds of inactivity allowed before refresh is suppressed. */
const ACTIVITY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/** Milliseconds to throttle activity event updates. */
const ACTIVITY_THROTTLE_MS = 30 * 1000; // 30 seconds

/** Default ceiling for the refresh trigger threshold in milliseconds. */
const MAX_REFRESH_TRIGGER_MS = 4 * 60 * 60 * 1000; // 4 hours

/** Fraction of session duration used as the refresh trigger threshold. */
const REFRESH_TRIGGER_FRACTION = 0.25;

/**
 * Minimum session duration (in multiples of the check interval) required for
 * the periodic check to reliably observe the session inside the trigger
 * window before it expires.
 */
const MIN_DURATION_CHECK_MULTIPLIER = 4;

/** Milliseconds between refresh condition checks. */
const REFRESH_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/** Whether to pause the refresh timer when the page is hidden. */
const PAUSE_ON_HIDDEN = true;

/**
 * Monitors user activity and automatically extends sessions that are about to
 * expire. Activity events (clicks, key presses, mouse moves, etc.) are
 * throttled to avoid excessive updates, and the refresh timer is paused when
 * the page is hidden to conserve resources.
 */
export default class SessionRefreshManager {
  private lastActivity = Date.now();
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private activityListeners: { event: string; handler: () => void }[] = [];
  private activityThrottleTimer?: ReturnType<typeof setTimeout>;
  private isRunning = false;
  private config: Required<SessionConfig>;
  private visibilityHandler?: () => void;
  private hasVisibilityListener = false;
  private consecutiveErrors = 0;
  private isRefreshing = false;
  private refreshTriggerMs: number;

  constructor(private sessionManager: SessionManagerDependency) {
    this.config = sessionManager.config;
    this.visibilityHandler = this.handleVisibilityChange.bind(this);

    // Derive the refresh trigger from the session duration so short sessions
    // do not trigger a refresh on every single check interval.
    this.refreshTriggerMs = Math.min(
      MAX_REFRESH_TRIGGER_MS,
      this.config.sessionDurationMs * REFRESH_TRIGGER_FRACTION
    );
  }

  /**
   * Start monitoring activity and schedule the refresh timer.
   */
  public start(): void {
    if (this.isRunning || !this.config.enableActivityRefresh) {
      return;
    }

    // Guard against non-browser environments (SSR, Web Workers, Node.js).
    if (typeof document === 'undefined') {
      log.warn(
        '[SessionRefreshManager] No document available; ' +
          'activity monitoring disabled'
      );
      return;
    }

    const minDurationMs =
      MIN_DURATION_CHECK_MULTIPLIER * REFRESH_CHECK_INTERVAL_MS;
    if (this.config.sessionDurationMs < minDurationMs) {
      const minMinutes = minDurationMs / 60_000;
      const actualMinutes = this.config.sessionDurationMs / 60_000;
      log.warn(
        `[SessionRefreshManager] Session duration (${actualMinutes}m) is less ` +
          `than the minimum recommended for auto-refresh (${minMinutes}m). ` +
          `The periodic check may not observe the session inside the refresh ` +
          `window before it expires.`
      );
    }

    this.isRunning = true;
    this.lastActivity = Date.now();
    this.consecutiveErrors = 0;

    this.setupActivityMonitoring();
    this.resumeRefreshTimer();

    if (PAUSE_ON_HIDDEN && this.visibilityHandler) {
      document.addEventListener('visibilitychange', this.visibilityHandler);
      this.hasVisibilityListener = true;
    }
  }

  /**
   * Stop monitoring and clean up all listeners and timers.
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.cleanupTimersAndListeners();

    if (this.hasVisibilityListener && this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.hasVisibilityListener = false;
    }
  }

  /**
   * Register DOM event listeners for user activity signals.
   */
  private setupActivityMonitoring(): void {
    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

    const throttledUpdater = this.createThrottledActivityUpdater();

    events.forEach((event) => {
      const handler = () => throttledUpdater();
      document.addEventListener(event, handler, { passive: true });
      this.activityListeners.push({ event, handler });
    });
  }

  /**
   * Create a throttled callback that updates the last-activity timestamp at
   * most once per {@link ACTIVITY_THROTTLE_MS} milliseconds.
   */
  private createThrottledActivityUpdater(): () => void {
    let isThrottled = false;

    return () => {
      if (isThrottled) {
        return;
      }

      isThrottled = true;
      this.lastActivity = Date.now();

      this.activityThrottleTimer = setTimeout(() => {
        isThrottled = false;
      }, ACTIVITY_THROTTLE_MS);
    };
  }

  /**
   * Schedule the next refresh-condition check.
   */
  private resumeRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const checkInterval = REFRESH_CHECK_INTERVAL_MS;

    this.refreshTimer = setTimeout(async () => {
      await this.checkAndRefreshSession();
      if (this.isRunning) {
        this.resumeRefreshTimer();
      }
    }, checkInterval);
  }

  /**
   * Pause the periodic refresh timer.
   */
  private pauseRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Evaluate whether the session should be refreshed based on recent user
   * activity and the time remaining until expiry.
   */
  private async checkAndRefreshSession(): Promise<void> {
    // Guard against concurrent refresh attempts from overlapping timer
    // callbacks or forceRefreshCheck calls.
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;
    try {
      const recentActivity = Date.now() - this.lastActivity;
      if (recentActivity >= ACTIVITY_THRESHOLD_MS) {
        log.debug(
          `[SessionRefreshManager] Refresh suppressed: user inactive ` +
            `for ${Math.round(recentActivity / 1000)}s`
        );
        return;
      }

      const timeUntilExpiry = this.sessionManager.sessionTimeRemaining;
      if (timeUntilExpiry > 0 && timeUntilExpiry < this.refreshTriggerMs) {
        const refreshed = await this.sessionManager.refreshSession();

        if (refreshed) {
          this.consecutiveErrors = 0;
          log.info('[SessionRefreshManager] Session automatically refreshed');
        } else {
          log.warn(
            '[SessionRefreshManager] Session refresh declined ' +
              '(max refreshes or max age reached)'
          );
        }
      }
    } catch (error) {
      this.consecutiveErrors++;
      log.error(
        `[SessionRefreshManager] Refresh check failed ` +
          `(attempt ${this.consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
        error
      );

      if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        // Intentionally allow the session to expire after repeated
        // infrastructure failures rather than masking persistent errors
        // with an infinite retry loop. The log.error call is sufficient
        // for diagnostics; no callback or user notification is needed.
        log.error('[SessionRefreshManager] Stopping after repeated failures');
        this.stop();
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Pause the timer when the page becomes hidden and resume when visible.
   */
  private handleVisibilityChange(): void {
    if (!this.isRunning) {
      return;
    }

    if (document.hidden) {
      this.pauseRefreshTimer();
    } else {
      this.lastActivity = Date.now();
      this.resumeRefreshTimer();
    }
  }

  /**
   * Remove all timers and DOM event listeners.
   */
  private cleanupTimersAndListeners(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    if (this.activityThrottleTimer) {
      clearTimeout(this.activityThrottleTimer);
      this.activityThrottleTimer = undefined;
    }

    this.activityListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    this.activityListeners = [];
  }

  /**
   * Return the timestamp of the most recent user activity.
   */
  public getLastActivity(): number {
    return this.lastActivity;
  }

  /**
   * Return whether the refresh manager is currently running.
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Force an immediate refresh-condition check. Returns true if the manager is
   * still running after the check, or false if the manager was not running or
   * stopped itself due to repeated failures.
   */
  public async forceRefreshCheck(): Promise<boolean> {
    if (!this.isRunning) {
      log.warn(
        '[SessionRefreshManager] forceRefreshCheck called while not running'
      );
      return false;
    }

    await this.checkAndRefreshSession();
    return this.isRunning;
  }
}
