import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/StyledText';
import { useUnistyles } from 'react-native-unistyles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { t } from '@/text';

/**
 * MCP Server configuration from CLI sync
 * This matches the structure synced from the CLI's MCP config
 */
export interface McpServerConfig {
    /** Whether the server is disabled */
    disabled?: boolean;
    /** Number of tools provided by this server (from validation) */
    toolCount?: number;
    /** ISO timestamp when server was last validated */
    lastValidated?: string;
    /** Type of server connection (stdio, sse, etc.) */
    type?: string;
    /** Command to run for stdio servers */
    command?: string;
    /** URL for SSE/HTTP servers */
    url?: string;
}

export interface McpServerCardProps {
    /** Server name (key from MCP config) */
    name: string;
    /** Server configuration */
    config: McpServerConfig;
    /** Whether the card is read-only (Phase 1 is always read-only) */
    readOnly?: boolean;
}

/**
 * Displays a single MCP server's configuration and status.
 *
 * Phase 1: Read-only display showing:
 * - Server name
 * - Enabled/disabled status
 * - Tool count (if validated)
 * - Last validation timestamp
 */
export function McpServerCard({ name, config, readOnly: _readOnly = true }: McpServerCardProps) {
    const { theme } = useUnistyles();

    const isDisabled = config.disabled === true;
    const toolCount = config.toolCount;
    const lastValidated = config.lastValidated;

    // Format the validation timestamp if available
    const formattedDate = lastValidated
        ? new Date(lastValidated).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : null;

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.header}>
                <View style={styles.nameContainer}>
                    <Ionicons
                        name="server-outline"
                        size={20}
                        color={isDisabled ? theme.colors.textSecondary : theme.colors.text}
                    />
                    <Text
                        style={[
                            styles.name,
                            { color: isDisabled ? theme.colors.textSecondary : theme.colors.text }
                        ]}
                    >
                        {name}
                    </Text>
                </View>
                <View
                    style={[
                        styles.badge,
                        {
                            backgroundColor: isDisabled
                                ? theme.colors.status.disconnected + '20'
                                : theme.colors.status.connected + '20'
                        }
                    ]}
                >
                    <Text
                        style={[
                            styles.badgeText,
                            {
                                color: isDisabled
                                    ? theme.colors.status.disconnected
                                    : theme.colors.status.connected
                            }
                        ]}
                    >
                        {isDisabled ? t('settingsMcp.disabled') : t('settingsMcp.enabled')}
                    </Text>
                </View>
            </View>

            <View style={styles.meta}>
                <View style={styles.metaItem}>
                    <Ionicons
                        name="construct-outline"
                        size={14}
                        color={theme.colors.textSecondary}
                    />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                        {toolCount !== undefined
                            ? t('settingsMcp.toolCount', { count: toolCount })
                            : t('settingsMcp.toolCountUnknown')
                        }
                    </Text>
                </View>
                {formattedDate && (
                    <View style={styles.metaItem}>
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={14}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                            {t('settingsMcp.lastValidated', { date: formattedDate })}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    meta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 13,
    },
});
