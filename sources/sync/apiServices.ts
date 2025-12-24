import { AuthCredentials } from '@/auth/tokenStorage';
import { backoff } from '@/utils/time';
import { getServerUrl } from './serverConfig';
import { AppError, ErrorCodes } from '@/utils/errors';
import { authenticatedFetch } from './apiHelper';

/**
 * Connect a service to the user's account
 */
export async function connectService(
    credentials: AuthCredentials,
    service: string,
    token: any
): Promise<void> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        // HAP-529: Use authenticatedFetch for automatic 401 retry after token refresh
        const response = await authenticatedFetch(
            `${API_ENDPOINT}/v1/connect/${service}/register`,
            credentials,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: JSON.stringify(token) })
            },
            `connecting ${service}`
        );

        if (!response.ok) {
            throw new AppError(ErrorCodes.SERVICE_ERROR, `Failed to connect ${service}: ${response.status}`);
        }

        const data = await response.json() as { success: true };
        if (!data.success) {
            throw new AppError(ErrorCodes.SERVICE_ERROR, `Failed to connect ${service} account`);
        }
    });
}

/**
 * Disconnect a connected service from the user's account
 */
export async function disconnectService(credentials: AuthCredentials, service: string): Promise<void> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        // HAP-529: Use authenticatedFetch for automatic 401 retry after token refresh
        const response = await authenticatedFetch(
            `${API_ENDPOINT}/v1/connect/${service}`,
            credentials,
            { method: 'DELETE' },
            `disconnecting ${service}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                const error = await response.json();
                throw new AppError(ErrorCodes.SERVICE_NOT_CONNECTED, error.error || `${service} account not connected`);
            }
            throw new AppError(ErrorCodes.SERVICE_ERROR, `Failed to disconnect ${service}: ${response.status}`);
        }

        const data = await response.json() as { success: true };
        if (!data.success) {
            throw new AppError(ErrorCodes.SERVICE_ERROR, `Failed to disconnect ${service} account`);
        }
    });
}