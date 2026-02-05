import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/api';
import socketService from '@/services/socket';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DeckScreen() {
    const { roomId } = useLocalSearchParams();
    const { token } = useAuth();
    const router = useRouter();

    const [deck, setDeck] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!roomId || !token) return;
        loadDeck();
    }, [roomId, token]);

    const loadDeck = async () => {
        try {
            const roomData = await apiService.getRoom(roomId as string);
            setDeck(roomData.deck);
        } catch (error) {
            console.error('Failed to load deck:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendCard = async (card: any) => {
        if (sending) return;

        setSending(true);
        try {
            const response = await apiService.sendChallenge(
                roomId as string,
                card.id,
                card.content
            );

            socketService.notifyChallengeSent(roomId as string, response.challenge.id);

            // Go back to dashboard
            router.back();
        } catch (error) {
            console.error('Failed to send challenge:', error);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#e94560" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back to Dashboard</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Select a Card to Send</Text>
            </View>

            <View style={styles.cardGrid}>
                {deck?.cards?.map((card: any) => (
                    <TouchableOpacity
                        key={card.id}
                        style={[styles.card, card.isFixed && styles.cardSpecial]}
                        onPress={() => handleSendCard(card)}
                        disabled={sending}
                    >
                        <Text style={styles.cardContent}>{card.content}</Text>
                        {card.isFixed && (
                            <Text style={styles.cardBadge}>Special</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {sending && (
                <View style={styles.sendingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.sendingText}>Sending...</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        padding: 20,
    },
    backButton: {
        color: '#e94560',
        fontSize: 16,
        marginBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    cardGrid: {
        padding: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    card: {
        backgroundColor: '#16213e',
        borderRadius: 12,
        padding: 20,
        width: '47%',
        minHeight: 120,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    cardSpecial: {
        borderColor: '#ffd700',
        backgroundColor: '#1f2a44',
    },
    cardContent: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
    },
    cardBadge: {
        marginTop: 8,
        fontSize: 10,
        color: '#ffd700',
        fontWeight: 'bold',
    },
    sendingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendingText: {
        color: '#fff',
        fontSize: 18,
        marginTop: 10,
    },
});
