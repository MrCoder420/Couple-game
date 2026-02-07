import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { Challenge, Penalty } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AlertTriangle, CheckCircle, Clock, Inbox, Send, XCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const EventItem = ({ event, userId }: { event: Challenge | Penalty, userId: string }) => {
    const isChallenge = 'cardId' in event;

    if (isChallenge) {
        const c = event as Challenge;
        const isSender = c.senderId === userId;
        const statusColor = c.status === 'accepted' ? '#4CAF50' : c.status === 'rejected' ? '#EF4444' : '#FFB74D';
        let StatusIcon = Clock;
        if (c.status === 'accepted') StatusIcon = CheckCircle;
        else if (c.status === 'rejected') StatusIcon = XCircle;

        return (
            <LinearGradient
                colors={['#2A1A2E', '#1A101F']}
                style={styles.item}
            >
                <View style={styles.itemHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20`, borderColor: `${statusColor}40` }]}>
                        <StatusIcon size={12} color={statusColor} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{c.status.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.date}>{new Date(c.sentAt).toLocaleDateString()}</Text>
                </View>

                <Text style={styles.cardContent}>"{c.cardContent}"</Text>

                <View style={styles.itemFooter}>
                    <Text style={styles.recipientText}>
                        {isSender ? 'To Partner' : 'From Partner'} • {new Date(c.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </LinearGradient>
        );
    } else {
        const p = event as Penalty;
        return (
            <LinearGradient
                colors={['#2A1A2E', '#1A101F']}
                style={[styles.item, styles.penaltyItem]}
            >
                <View style={styles.itemHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#F59E0B' }]}>
                        <AlertTriangle size={12} color="#F59E0B" />
                        <Text style={[styles.statusText, { color: '#F59E0B' }]}>PENALTY</Text>
                    </View>
                    <Text style={styles.date}>{new Date(p.appliedAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.cardContent}>{p.description}</Text>
            </LinearGradient>
        );
    }
};

export default function History() {
    const { events } = useGame();
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

    if (!user) return null;

    const challenges = events.filter(e => 'cardId' in e) as Challenge[];
    const penalties = events.filter(e => !('cardId' in e)) as Penalty[];

    const displayedEvents = activeTab === 'sent'
        ? challenges.filter(c => c.senderId === user.id)
        : challenges.filter(c => c.senderId !== user.id);

    const finalEvents: (Challenge | Penalty)[] = [...displayedEvents];
    if (activeTab === 'received') {
        finalEvents.push(...penalties);
    }

    const getTime = (item: Challenge | Penalty) => {
        if ('sentAt' in item) return new Date((item as Challenge).sentAt).getTime();
        return new Date((item as Penalty).appliedAt).getTime();
    };

    const listData = finalEvents.sort((a, b) => getTime(b) - getTime(a));

    return (
        <LinearGradient
            colors={['#0F0F1E', '#1A101F']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>History</Text>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'received' && styles.activeTab]}
                        onPress={() => setActiveTab('received')}
                    >
                        <Inbox size={18} color={activeTab === 'received' ? '#fff' : '#888'} />
                        <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>Received</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
                        onPress={() => setActiveTab('sent')}
                    >
                        <Send size={18} color={activeTab === 'sent' ? '#fff' : '#888'} />
                        <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>Sent</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={listData}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => <EventItem event={item} userId={user.id} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                                style={styles.emptyIconBg}
                            >
                                {activeTab === 'sent' ? <Send size={32} color="#888" /> : <Inbox size={32} color="#888" />}
                            </LinearGradient>
                            <Text style={styles.emptyText}>
                                {activeTab === 'sent' ? "No sent challenges" : "No received challenges"}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {activeTab === 'sent' ? "Start a challenge from the Deck!" : "Your history will appear here."}
                            </Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    activeTab: {
        backgroundColor: 'rgba(255, 75, 110, 0.15)',
        borderColor: '#FF4B6E',
    },
    tabText: {
        color: '#888',
        fontWeight: '600',
        fontSize: 14,
    },
    activeTabText: {
        color: '#fff',
    },
    list: {
        padding: 24,
        paddingTop: 0,
        paddingBottom: 40,
    },
    item: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 75, 110, 0.2)',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    date: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: '500',
    },
    cardContent: {
        color: '#fff',
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '500',
        marginBottom: 12,
    },
    itemFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recipientText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
    penaltyItem: {
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
    },
});
