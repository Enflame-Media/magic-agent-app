import * as React from 'react';
import { Modal } from '@/modal';
import { t } from '@/text';
import { AppError, getSmartErrorMessage } from '@/utils/errors';

export function useHappyAction(action: () => Promise<void>) {
    const [loading, setLoading] = React.useState(false);
    const loadingRef = React.useRef(false);
    const doAction = React.useCallback(() => {
        if (loadingRef.current) {
            return;
        }
        loadingRef.current = true;
        setLoading(true);
        (async () => {
            try {
                while (true) {
                    try {
                        await action();
                        break;
                    } catch (e) {
                        if (AppError.isAppError(e)) {
                            // HAP-530: Use getSmartErrorMessage for AppErrors (includes Support ID for server errors)
                            const errorMessage = getSmartErrorMessage(e);
                            if (e.canTryAgain) {
                                // Ask user if they want to retry - if yes, continue loop; if no, break
                                const shouldRetry = await Modal.confirm(t('common.error'), errorMessage, {
                                    cancelText: t('common.cancel'),
                                    confirmText: t('common.retry'),
                                });
                                if (!shouldRetry) {
                                    break;
                                }
                                // User chose to retry - continue the while loop
                            } else {
                                Modal.alert(t('common.error'), errorMessage, [{ text: t('common.ok'), style: 'cancel' }]);
                                break;
                            }
                        } else {
                            Modal.alert(t('common.error'), t('errors.unknownError'), [{ text: t('common.ok'), style: 'cancel' }]);
                            break;
                        }
                    }
                }
            } finally {
                loadingRef.current = false;
                setLoading(false);
            }
        })();
    }, [action]);
    return [loading, doAction] as const;
}