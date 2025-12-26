/**
 * Analytics API module for reporting sync metrics to the server.
 *
 * HAP-547: This module provides fire-and-forget metrics reporting
 * to enable server-side analytics without impacting sync performance.
 *
 * Design principles:
 * - Fire-and-forget: Never blocks sync operations
 * - Silent failures: Network errors are caught and ignored
 * - Authentication-aware: Only reports when credentials are available
 * - Timeout-protected: 5-second abort to prevent hanging connections
 */

import { AuthCredentials } from '@/auth/tokenStorage';
import { getServerUrl } from './serverConfig';

/**
 * Sync metrics data structure matching the server's expected format.
 * This interface mirrors the SyncMetrics interface in sync.ts.
 */
export interface SyncMetricPayload {
    type: 'messages' | 'profile' | 'artifacts';
    mode: 'full' | 'incremental' | 'cached';
    bytesReceived: number;
    itemsReceived: number;
    itemsSkipped: number;
    durationMs: number;
    sessionId?: string;
}

/**
 * Module-level credentials storage for fire-and-forget operations.
 * Set via setAnalyticsCredentials when auth state changes.
 */
let analyticsCredentials: AuthCredentials | null = null;

/**
 * Sets the credentials used for analytics reporting.
 * Call this when the user logs in or credentials are refreshed.
 *
 * @param credentials - The auth credentials, or null to disable reporting
 */
export function setAnalyticsCredentials(credentials: AuthCredentials | null): void {
    analyticsCredentials = credentials;
}

/**
 * Reports a sync metric to the analytics endpoint.
 *
 * This function is designed to be fire-and-forget:
 * - Does not return a promise that callers should await
 * - Silently ignores all errors (network, timeout, auth, etc.)
 * - Uses AbortController with 5-second timeout
 * - Only reports when authenticated
 *
 * @param metric - The sync metric to report
 */
export function reportSyncMetric(metric: SyncMetricPayload): void {
    // Don't report if not authenticated
    if (!analyticsCredentials) {
        return;
    }

    const API_ENDPOINT = getServerUrl();
    const url = `${API_ENDPOINT}/v1/analytics/sync`;

    // Create AbortController for 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Fire-and-forget: execute but don't await
    void (async () => {
        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${analyticsCredentials!.token}`,
                },
                body: JSON.stringify(metric),
                signal: controller.signal,
            });
            // Response is intentionally ignored - fire-and-forget
        } catch {
            // Silently ignore all errors (network, timeout, abort, etc.)
            // This is intentional to avoid any impact on sync UX
        } finally {
            clearTimeout(timeoutId);
        }
    })();
}
