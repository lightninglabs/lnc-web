import { SessionCredentialStoreConfig } from '../types/lnc';
import SessionManager from './sessionManager';

/**
 * Session refresh manager handles automatic session extension based on user activity.
 * Monitors user interactions and extends sessions when appropriate.
 * Now uses SessionManager instead of direct repository access.
 */
export default class SessionRefreshManager {
    private lastActivity = Date.now();
    private refreshTimer?: ReturnType<typeof setTimeout>;
    private activityListeners: { event: string; handler: () => void }[] = [];
    private activityThrottleTimer?: ReturnType<typeof setTimeout>;
    private isRunning = false;
    private config: Required<SessionCredentialStoreConfig>;

    constructor(private sessionManager: SessionManager) {
        // Use default config for now - can be made configurable later
        this.config = {
            sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
            requireUserGesture: false,
            enableActivityRefresh: true,
            activityThreshold: 30, // minutes
            activityThrottleInterval: 30, // seconds
            refreshTrigger: 4, // hours
            refreshCheckInterval: 5, // minutes
            pauseOnHidden: true,
            maxRefreshes: 10,
            maxSessionAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };
    }

    /**
     * Start monitoring activity and refresh timer
     */
    public start(): void {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.lastActivity = Date.now();

        this.setupActivityMonitoring();
        this.resumeRefreshTimer();

        // Set up visibility change listener
        if (this.config.pauseOnHidden) {
            document.addEventListener(
                'visibilitychange',
                this.handleVisibilityChange.bind(this)
            );
        }
    }

    /**
     * Stop monitoring and clean up
     */
    public stop(): void {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        this.cleanupTimersAndListeners();

        if (this.config.pauseOnHidden) {
            document.removeEventListener(
                'visibilitychange',
                this.handleVisibilityChange.bind(this)
            );
        }
    }

    /**
     * Set up activity monitoring
     */
    private setupActivityMonitoring(): void {
        const events = [
            'click',
            'keydown',
            'mousemove',
            'scroll',
            'touchstart'
        ];

        const throttledUpdater = this.createThrottledActivityUpdater();

        events.forEach((event) => {
            const handler = () => throttledUpdater();
            document.addEventListener(event, handler, { passive: true });
            this.activityListeners.push({ event, handler });
        });
    }

    /**
     * Create throttled activity updater to prevent excessive updates
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
            }, this.config.activityThrottleInterval * 1000);
        };
    }

    /**
     * Resume the refresh timer
     */
    private resumeRefreshTimer(): void {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        const checkInterval = this.config.refreshCheckInterval * 60 * 1000; // Convert minutes to ms

        this.refreshTimer = setTimeout(async () => {
            await this.checkAndRefreshSession();
            if (this.isRunning) {
                this.resumeRefreshTimer(); // Schedule next check
            }
        }, checkInterval);
    }

    /**
     * Pause the refresh timer
     */
    private pauseRefreshTimer(): void {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = undefined;
        }
    }

    /**
     * Check conditions and refresh session if appropriate
     */
    private async checkAndRefreshSession(): Promise<void> {
        try {
            // Check if user has been active recently
            const recentActivity = Date.now() - this.lastActivity;
            const activityThresholdMs =
                this.config.activityThreshold * 60 * 1000;

            if (recentActivity >= activityThresholdMs) {
                // User hasn't been active recently, don't refresh
                return;
            }

            // Check if session needs refresh
            const timeUntilExpiry =
                this.sessionManager.getSessionTimeRemaining();
            const refreshTriggerMs =
                this.config.refreshTrigger * 60 * 60 * 1000; // Convert hours to ms

            if (timeUntilExpiry > 0 && timeUntilExpiry < refreshTriggerMs) {
                const refreshed = await this.sessionManager.refreshSession();

                if (refreshed) {
                    console.log('Session automatically refreshed');
                } else {
                    console.log('Session refresh failed or reached limits');
                }
            }
        } catch (error) {
            console.error('Error during session refresh check:', error);
        }
    }

    /**
     * Handle page visibility changes
     */
    private handleVisibilityChange(): void {
        if (document.hidden) {
            this.pauseRefreshTimer();
        } else {
            this.lastActivity = Date.now(); // Update activity when page becomes visible
            this.resumeRefreshTimer();
        }
    }

    /**
     * Clean up timers and event listeners
     */
    private cleanupTimersAndListeners(): void {
        // Clear timers
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = undefined;
        }

        if (this.activityThrottleTimer) {
            clearTimeout(this.activityThrottleTimer);
            this.activityThrottleTimer = undefined;
        }

        // Remove event listeners
        this.activityListeners.forEach(({ event, handler }) => {
            document.removeEventListener(event, handler);
        });
        this.activityListeners = [];
    }

    /**
     * Get the last activity timestamp
     */
    public getLastActivity(): number {
        return this.lastActivity;
    }

    /**
     * Manually trigger activity update (useful for testing or specific events)
     */
    public recordActivity(): void {
        this.lastActivity = Date.now();
    }

    /**
     * Get time since last activity in milliseconds
     */
    public getTimeSinceLastActivity(): number {
        return Date.now() - this.lastActivity;
    }

    /**
     * Check if the refresh manager is currently running
     */
    public isActive(): boolean {
        return this.isRunning;
    }

    /**
     * Force a refresh check (useful for testing or manual triggers)
     */
    public async forceRefreshCheck(): Promise<void> {
        if (this.isRunning) {
            await this.checkAndRefreshSession();
        }
    }
}
