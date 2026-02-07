import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/api';
import socketService from '@/services/socket';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DeckView() {
    const { roomId } = useLocalSearchParams();
    const { user, token } = useAuth();
    const router = useRouter();

    const [deck, setDeck] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<any>(null);
    const [sendingCard, setSendingCard] = useState(false);

    useEffect(() => {
        if (!roomId || !token) return;
        loadDeck();
    }, [roomId, token]);

    const loadDeck = async () => {
        try {
            setLoading(true);
            const response = await apiService.getRoom(roomId as string);
            setDeck(response.deck);
        } catch (error) {
            console.error('Failed to load deck:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardPress = (card: any) => {
        setSelectedCard(card);
    };

    const handleSendToPartner = async () => {
        if (!selectedCard) return;

        setSendingCard(true);
        try {
            // Send card via socket
            socketService.sendCard(selectedCard);

            // Close modal
            setSelectedCard(null);

            // Show success (you could add a toast notification here)
            console.log('Card sent successfully!');
        } catch (error) {
            console.error('Failed to send card:', error);
        } finally {
            setSendingCard(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e94560" />
                <Text style={styles.loadingText}>Loading deck...</Text>
            </View>
        );
    }

    const availableCards = deck?.cards?.filter((card: any) =>
        !deck.used_card_ids?.includes(card.id)
    ) || [];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Challenge Deck</Text>
                <Text style={styles.headerSubtitle}>{availableCards.length} cards available</Text>
            </LinearGradient>

            <ScrollView style={styles.content}>
                <FlatList
                    data={availableCards}
                    numColumns={2}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    columnWrapperStyle={styles.row}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => handleCardPress(item)}
                        >
                            <LinearGradient
                                colors={['#1a1a2e', '#16213e']}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardEmoji}>
                                    {item.type === 'skip' ? '⏭️' :
                                        item.type === 'swap' ? '🔄' :
                                            item.type === 'reverse' ? '↩️' :
                                                item.type === 'shield' ? '🛡️' :
                                                    item.type === 'reveal' ? '👁️' : '💌'}
                                </Text>
                                <Text style={styles.cardTitle}>{item.title || item.type}</Text>
                                <Text style={styles.cardCategory} numberOfLines={1}>
                                    {item.category || 'Challenge'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No cards available</Text>
                    }
                />
            </ScrollView>

            {/* Card Details Modal */}
            {selectedCard && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>💝 {selectedCard.title || selectedCard.type}</Text>

                        <View style={styles.detailsContainer}>
                            <Text style={styles.detailLabel}>Category</Text>
                            <Text style={styles.detailValue}>{selectedCard.category || 'Challenge'}</Text>

                            <Text style={styles.detailLabel}>Description</Text>
                            <Text style={styles.detailValue}>{selectedCard.content || selectedCard.description}</Text>

                            {selectedCard.difficulty && (
                                <>
                                    <Text style={styles.detailLabel}>Difficulty</Text>
                                    <Text style={styles.detailValue}>{selectedCard.difficulty}</Text>
                                </>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.sendButton, sendingCard && styles.sendButtonDisabled]}
                            onPress={handleSendToPartner}
                            disabled={sendingCard}
                        >
                            <Text style={styles.sendButtonText}>
                                {sendingCard ? '⏳ Sending...' : '💌 Send to Partner'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setSelectedCard(null)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F1E',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0F0F1E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
    },
    header: {
        padding: 24,
        paddingTop: 48,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        marginBottom: 16,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    card: {
        width: '48%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardGradient: {
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(233, 69, 96, 0.3)',
        borderRadius: 16,
    },
    cardEmoji: {
        fontSize: 40,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
    },
    cardCategory: {
        fontSize: 12,
        color: '#e94560',
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: '#aaa',
        fontSize: 16,
        marginTop: 40,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#16213e',
        borderRadius: 24,
        padding: 32,
        width: '90%',
        maxWidth: 400,
        borderWidth: 2,
        borderColor: '#e94560',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 24,
        textAlign: 'center',
    },
    detailsContainer: {
        marginBottom: 24,
    },
    detailLabel: {
        fontSize: 12,
        color: '#aaa',
        marginTop: 12,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        color: '#fff',
        lineHeight: 24,
    },
    sendButton: {
        backgroundColor: '#e94560',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#aaa',
        fontSize: 16,
    },
});
