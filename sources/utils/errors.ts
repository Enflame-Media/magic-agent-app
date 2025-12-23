/**
 * Error utilities for safe error handling and standardized error management.
 *
 * This module re-exports the shared AppError from @happy/errors and provides
 * app-specific error codes and user-friendly message utilities.
 *
 * @module utils/errors
 *
 * @remarks
 * Error messages are designed for end users - they should be:
 * - Actionable: Tell the user what they can do ("Try again", "Check your connection")
 * - Non-technical: Avoid jargon, error codes, or stack traces
 * - Reassuring: Don't alarm users unnecessarily
 *
 * Technical details are kept in the `cause` property for debugging/logging.
 */

// Re-export AppError and types from shared package
export { AppError } from '@happy/errors';
export type { AppErrorOptions, AppErrorJSON } from '@happy/errors';

/**
 * User-friendly messages for each error code.
 * These messages are safe to display to end users.
 *
 * @remarks
 * When adding new error codes, always add a corresponding user-friendly message here.
 * Messages should be:
 * - Written in plain language (no technical jargon)
 * - Actionable (tell users what to do)
 * - Reassuring (don't alarm users)
 */
export const UserFriendlyMessages: Record<string, string> = {
    // Auth errors - guide users on authentication issues
    AUTH_FAILED: 'Unable to sign in. Please try again or re-scan the QR code.',
    INVALID_KEY: 'Your session has expired. Please sign in again.',
    NOT_AUTHENTICATED: 'Please sign in to continue.',
    TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',

    // Socket/RPC errors - network issues users can retry
    SOCKET_NOT_CONNECTED: 'Connection lost. Please check your internet and try again.',
    RPC_CANCELLED: 'Request was cancelled. Please try again.',
    RPC_FAILED: 'Unable to complete the request. Please try again.',
    SYNC_FAILED: 'Unable to sync your data. Please check your connection and try again.',

    // API errors - general API issues
    API_ERROR: 'Something went wrong. Please try again.',
    FETCH_FAILED: 'Unable to connect. Please check your internet connection.',
    FETCH_ABORTED: 'Request was cancelled. Please try again.',
    TIMEOUT: 'The request took too long. Please try again.',

    // Encryption errors - these shouldn't happen in normal use
    ENCRYPTION_ERROR: 'A security error occurred. Please try again or contact support.',
    DECRYPTION_FAILED: 'Unable to read secure data. Please try again or contact support.',

    // Resource errors - missing or conflicting data
    NOT_FOUND: 'The requested item could not be found.',
    VERSION_CONFLICT: 'This item was updated elsewhere. Please refresh and try again.',
    ALREADY_EXISTS: 'This item already exists.',

    // Validation errors - user input issues
    INVALID_INPUT: 'Please check your input and try again.',
    VALIDATION_FAILED: 'Please check your input and try again.',

    // Configuration errors
    NOT_CONFIGURED: 'Setup required. Please complete the configuration.',

    // Subscription/Purchase errors
    PRODUCT_NOT_FOUND: 'This product is not available. Please try again later.',

    // Service errors - backend issues
    SERVICE_ERROR: 'Something went wrong on our end. Please try again later.',
    SERVICE_NOT_CONNECTED: 'Unable to connect to the service. Please try again.',

    // Internal errors - fallback
    INTERNAL_ERROR: 'Something went wrong. Please try again or contact support if the problem persists.',
};

/**
 * Get a user-friendly message for an error code.
 *
 * @param code - The error code to look up
 * @returns User-friendly message, or a default fallback message
 *
 * @example
 * ```typescript
 * getUserFriendlyMessage('AUTH_FAILED');
 * // Returns: "Unable to sign in. Please try again or re-scan the QR code."
 * ```
 */
export function getUserFriendlyMessage(code: string): string {
    return UserFriendlyMessages[code] || 'Something went wrong. Please try again.';
}

/**
 * Standardized error codes for the happy-app application.
 * These codes provide programmatic error identification and consistent categorization.
 */
export const ErrorCodes = {
    // Auth errors
    AUTH_FAILED: 'AUTH_FAILED',
    INVALID_KEY: 'INVALID_KEY',
    NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED', // 401 from server - triggers logout, never retried

    // Socket/RPC errors
    SOCKET_NOT_CONNECTED: 'SOCKET_NOT_CONNECTED',
    RPC_CANCELLED: 'RPC_CANCELLED',
    RPC_FAILED: 'RPC_FAILED',
    SYNC_FAILED: 'SYNC_FAILED',

    // API errors
    API_ERROR: 'API_ERROR',
    FETCH_FAILED: 'FETCH_FAILED',
    FETCH_ABORTED: 'FETCH_ABORTED',
    TIMEOUT: 'TIMEOUT',

    // Encryption errors
    ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
    DECRYPTION_FAILED: 'DECRYPTION_FAILED',

    // Resource errors
    NOT_FOUND: 'NOT_FOUND',
    VERSION_CONFLICT: 'VERSION_CONFLICT',
    ALREADY_EXISTS: 'ALREADY_EXISTS',

    // Validation errors
    INVALID_INPUT: 'INVALID_INPUT',
    VALIDATION_FAILED: 'VALIDATION_FAILED',

    // Configuration errors
    NOT_CONFIGURED: 'NOT_CONFIGURED',

    // Subscription/Purchase errors
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',

    // Service errors
    SERVICE_ERROR: 'SERVICE_ERROR',
    SERVICE_NOT_CONNECTED: 'SERVICE_NOT_CONNECTED',

    // Internal errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * Type representing valid error codes from the ErrorCodes constant.
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Import AppError for the extended utilities below
import { AppError } from '@happy/errors';

/**
 * Get the user-friendly message for an AppError.
 *
 * @param error - The AppError instance
 * @returns User-friendly message suitable for display to end users
 *
 * @example
 * ```typescript
 * const error = new AppError(ErrorCodes.AUTH_FAILED, 'Technical details');
 * console.log(getAppErrorUserMessage(error));
 * // Returns: "Unable to sign in. Please try again or re-scan the QR code."
 * ```
 */
export function getAppErrorUserMessage(error: AppError): string {
    return getUserFriendlyMessage(error.code);
}

/**
 * HappyError is an alias for AppError for backward compatibility.
 * New code should use AppError directly.
 *
 * @deprecated Use AppError instead
 */
export class HappyError extends AppError {
    constructor(message: string, canTryAgain: boolean) {
        super(ErrorCodes.INTERNAL_ERROR, message, { canTryAgain });
        this.name = 'HappyError';
        Object.setPrototypeOf(this, HappyError.prototype);
    }
}
