/**
 * ToastProvider - Context provider and UI renderer for toast notifications
 *
 * Features:
 * - FIFO queue: Multiple toasts are queued and shown sequentially
 * - Configurable queue size (default: 5) and duplicate prevention
 * - Auto-dismiss after duration
 * - Optional action button (e.g., Undo)
 * - Haptic feedback on show
 * - Platform-appropriate styling
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { View, Pressable, Animated, Platform, AccessibilityInfo } from 'react-native';
import { Text } from '@/components/StyledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { hapticsLight } from '@/components/haptics';
import { Toast } from './ToastManager';
import { ToastConfig, ToastState, ToastContextValue, ToastQueueConfig } from './types';

const DEFAULT_DURATION = 5000; // 5 seconds for undo actions
const DEFAULT_MAX_QUEUE_SIZE = 5;
const DEFAULT_PREVENT_DUPLICATES = true;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Return a no-op implementation when used outside provider
        // This prevents crashes when Toast.show() is called before provider mounts
        return {
            state: { current: null, queue: [] },
            showToast: () => '',
            hideToast: () => {},
            clearAllToasts: () => {},
        };
    }
    return context;
}

interface ToastProviderProps {
    children: React.ReactNode;
    /** Queue configuration options */
    queueConfig?: ToastQueueConfig;
}

export function ToastProvider({ children, queueConfig }: ToastProviderProps) {
    const maxQueueSize = queueConfig?.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE;
    const preventDuplicates = queueConfig?.preventDuplicates ?? DEFAULT_PREVENT_DUPLICATES;

    const [state, setState] = useState<ToastState>({ current: null, queue: [] });
    const insets = useSafeAreaInsets();
    const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const generateId = useCallback(() => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }, []);

    // Use ref to break circular dependency between hideToast and showNextFromQueue
    const hideToastRef = useRef<(id: string) => void>(() => {});

    const showNextFromQueue = useCallback(() => {
        setState((prev) => {
            if (prev.queue.length === 0) {
                return { ...prev, current: null };
            }

            // Get the next toast from queue
            const [nextToast, ...remainingQueue] = prev.queue;

            // Schedule the animation and timer for the next toast
            // We do this in a setTimeout to ensure state is updated first
            setTimeout(() => {
                fadeAnim.setValue(0);
                Animated.spring(fadeAnim, {
                    toValue: 1,
                    useNativeDriver: Platform.OS !== 'web',
                    damping: 15,
                    stiffness: 150,
                }).start();

                // Haptic feedback
                if (Platform.OS !== 'web') {
                    hapticsLight();
                }

                // Accessibility announcement
                AccessibilityInfo.announceForAccessibility(nextToast.message);

                // Set auto-dismiss timer
                const duration = nextToast.duration ?? DEFAULT_DURATION;
                dismissTimerRef.current = setTimeout(() => {
                    hideToastRef.current(nextToast.id);
                }, duration);
            }, 0);

            return { current: nextToast, queue: remainingQueue };
        });
    }, [fadeAnim]);

    const hideToast = useCallback((id: string) => {
        setState((prev) => {
            // Also check if this toast is in the queue and remove it
            if (prev.current?.id !== id) {
                const filteredQueue = prev.queue.filter((t) => t.id !== id);
                if (filteredQueue.length !== prev.queue.length) {
                    return { ...prev, queue: filteredQueue };
                }
                return prev;
            }

            // Animate out the current toast
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => {
                // After animation, show next toast from queue
                showNextFromQueue();
            });
            return prev; // Let animation complete before clearing
        });

        // Clear timer for current toast
        if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
            dismissTimerRef.current = null;
        }
    }, [fadeAnim, showNextFromQueue]);

    // Keep ref in sync with latest hideToast
    hideToastRef.current = hideToast;

    const clearAllToasts = useCallback((skipAnimation = false) => {
        // Clear any pending auto-dismiss timer
        if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
            dismissTimerRef.current = null;
        }

        setState((prev) => {
            if (skipAnimation || !prev.current) {
                // Instant clear - no animation needed
                fadeAnim.setValue(0);
                return { current: null, queue: [] };
            }

            // Animate out current toast, then clear
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: Platform.OS !== 'web',
            }).start();

            return { current: null, queue: [] };
        });
    }, [fadeAnim]);

    const showToast = useCallback((config: Omit<ToastConfig, 'id'>): string => {
        const id = generateId();

        // Create the toast config
        const toastConfig: ToastConfig = {
            ...config,
            id,
            duration: config.duration ?? DEFAULT_DURATION,
        };

        setState((prev) => {
            // Check for duplicate messages if prevention is enabled
            if (preventDuplicates) {
                const isDuplicate =
                    prev.current?.message === config.message ||
                    prev.queue.some((t) => t.message === config.message);
                if (isDuplicate) {
                    return prev; // Skip duplicate
                }
            }

            // If no current toast, show immediately
            if (!prev.current) {
                // Clear any existing timer (safety)
                if (dismissTimerRef.current) {
                    clearTimeout(dismissTimerRef.current);
                }

                // Animate in
                fadeAnim.setValue(0);
                Animated.spring(fadeAnim, {
                    toValue: 1,
                    useNativeDriver: Platform.OS !== 'web',
                    damping: 15,
                    stiffness: 150,
                }).start();

                // Haptic feedback
                if (Platform.OS !== 'web') {
                    hapticsLight();
                }

                // Accessibility announcement
                AccessibilityInfo.announceForAccessibility(config.message);

                // Set auto-dismiss timer
                const duration = toastConfig.duration ?? DEFAULT_DURATION;
                dismissTimerRef.current = setTimeout(() => {
                    hideToast(id);
                }, duration);

                return { ...prev, current: toastConfig };
            }

            // Otherwise, add to queue (respecting max size)
            if (prev.queue.length >= maxQueueSize) {
                // Queue is full, drop the oldest queued toast to make room
                const newQueue = [...prev.queue.slice(1), toastConfig];
                return { ...prev, queue: newQueue };
            }

            return { ...prev, queue: [...prev.queue, toastConfig] };
        });

        return id;
    }, [generateId, fadeAnim, hideToast, preventDuplicates, maxQueueSize]);

    // Register functions with ToastManager
    useEffect(() => {
        Toast.setFunctions(showToast, hideToast, clearAllToasts);
    }, [showToast, hideToast, clearAllToasts]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (dismissTimerRef.current) {
                clearTimeout(dismissTimerRef.current);
            }
        };
    }, []);

    // Use a ref to track current toast to avoid stale closures in handleActionPress
    const currentToastRef = useRef(state.current);
    currentToastRef.current = state.current;

    const handleActionPress = useCallback(() => {
        const current = currentToastRef.current;
        if (current?.action) {
            // Haptic feedback
            if (Platform.OS !== 'web') {
                hapticsLight();
            }
            // Execute action
            current.action.onPress();
            // Dismiss toast
            hideToast(current.id);
        }
    }, [hideToast]);

    const contextValue: ToastContextValue = {
        state,
        showToast,
        hideToast,
        clearAllToasts,
    };

    const styles = stylesheet;

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            {state.current && (
                <Animated.View
                    style={[
                        styles.container,
                        {
                            bottom: insets.bottom + 16,
                            opacity: fadeAnim,
                            transform: [{
                                translateY: fadeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0],
                                }),
                            }],
                        },
                    ]}
                    pointerEvents="box-none"
                >
                    <View style={styles.toast}>
                        <Text style={styles.message} numberOfLines={2}>
                            {state.current.message}
                        </Text>
                        {state.current.action && (
                            <Pressable
                                onPress={handleActionPress}
                                style={({ pressed }) => [
                                    styles.actionButton,
                                    pressed && styles.actionButtonPressed,
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel={state.current.action.label}
                            >
                                <Text style={styles.actionText}>
                                    {state.current.action.label}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 9999,
        pointerEvents: 'box-none',
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.dark ? '#1C1C1E' : '#323232',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        minHeight: 48,
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    message: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
        ...Typography.default(),
    },
    actionButton: {
        marginLeft: 16,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    actionButtonPressed: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionText: {
        color: '#0A84FF',
        fontSize: 15,
        ...Typography.default('semiBold'),
    },
}));
