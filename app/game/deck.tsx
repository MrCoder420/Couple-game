import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import apiService from '@/services/api';
import socketService from '@/services/socket';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DeckScreen() {
    const { roomId } = useLocalSearchParams();
    const { user, token } = useAuth();
    const router = useRouter();

    const [deck, setDeck] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<any>(null);
    const [sendingCard, setSendingCard] = useState(false);

    const { checkChallenges, game } = useGame();

    useEffect(() => {
        // Handle roomId being string or array
        const rawId = roomId || game?.id;
        const activeRoomId = Array.isArray(rawId) ? rawId[0] : rawId;

        // Check for 'undefined' string which happens sometimes in string interpolation
        if (activeRoomId && activeRoomId !== 'undefined' && token) {
            console.log('[Deck] Loading deck for room:', activeRoomId);
            loadDeck(activeRoomId);
        } else if (!activeRoomId && !loading) {
            setLoading(false);
        } else if (!activeRoomId) {
            const timer = setTimeout(() => setLoading(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [roomId, token, game?.id]);

    const loadDeck = async (id: string) => {
        if (!id || id === 'undefined') {
            console.warn('[Deck] Invalid Room ID:', id);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const roomData = await apiService.getRoom(id);
            setDeck(roomData.deck);
        } catch (error: any) {
            console.error('[Deck] Failed to load deck:', error.message, 'ID:', id);
            // Don't alert detailed error to user, just log it. UI shows empty state.
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
            socketService.sendCard(selectedCard);
            await checkChallenges();
            setSelectedCard(null);
            setTimeout(() => router.back(), 800);
        } catch (error) {
            console.error('Failed to send card:', error);
        } finally {
            setSendingCard(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF4B6E" />
                <Text style={styles.loadingText}>Loading deck...</Text>
            </View>
        );
    }

    const allCards = deck?.cards || [];
    const usedIds = deck?.used_card_ids || [];

    const availableCards = allCards.filter((card: any) => {
        if (!card || !card.id) return false;
        return !usedIds.includes(card.id);
    });

    const renderCardItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleCardPress(item)}
        >
            <LinearGradient
                colors={['#2A1A2E', '#1A101F']}
                style={styles.cardGradient}
            >
                <Text style={styles.cardEmoji}>
                    {item.type === 'skip' ? '⏭️' :
                        item.type === 'swap' ? '🔄' :
                            item.type === 'reverse' ? '↩️' :
                                item.type === 'shield' ? '🛡️' :
                                    item.type === 'reveal' ? '👁️' : '💌'}
                </Text>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title || item.content || item.type}
                </Text>
                {item.category && (
                    <Text style={styles.cardCategory} numberOfLines={1}>
                        {item.category}
                    </Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={['#0F0F1E', '#1A101F']}
            style={styles.container}
        >
            <LinearGradient
                colors={['#2A1A2E', '#1A101F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Challenge Deck</Text>
                    <Text style={styles.headerSubtitle}>{availableCards.length} cards available</Text>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF4B6E" />
                    <Text style={styles.loadingText}>Loading cards...</Text>
                </View>
            ) : availableCards.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No cards available right now!</Text>
                    <Text style={styles.emptySubtext}>You've used all the cards or they generated incorrectly.</Text>
                    <TouchableOpacity onPress={() => {
                        const activeId = roomId || game?.id;
                        if (activeId) loadDeck(activeId as string);
                    }} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Refresh Deck</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={availableCards}
                    numColumns={2}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={styles.row}
                    renderItem={renderCardItem}
                />
            )}


            {/* Card Details Modal */}
            {
                selectedCard && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalEmoji}>
                                {selectedCard.type === 'skip' ? '⏭️' :
                                    selectedCard.type === 'swap' ? '🔄' :
                                        selectedCard.type === 'reverse' ? '↩️' :
                                            selectedCard.type === 'shield' ? '🛡️' :
                                                selectedCard.type === 'reveal' ? '👁️' : '💌'}
                            </Text>
                            <Text style={styles.modalTitle}>{selectedCard.title || selectedCard.type}</Text>

                            <View style={styles.detailsContainer}>
                                <Text style={styles.detailLabel}>Category</Text>
                                <Text style={styles.detailValue}>{selectedCard.category || 'Challenge'}</Text>

                                <Text style={styles.detailLabel}>Description</Text>
                                <Text style={styles.detailValue}>{selectedCard.content || selectedCard.description || 'No description'}</Text>

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
                                <LinearGradient
                                    colors={['#FF4B6E', '#FF7B9C']}
                                    style={styles.sendButtonGradient}
                                >
                                    <Text style={styles.sendButtonText}>
                                        {sendingCard ? '⏳ Sending...' : '💌 Send to Partner'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setSelectedCard(null)}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            }
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingTop: 60,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        gap: 16,
        paddingBottom: 24, // Consistent padding
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    listContent: {
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
        borderColor: 'rgba(255, 75, 110, 0.2)',
        borderRadius: 16,
        minHeight: 160,
        justifyContent: 'space-between',
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
        color: '#FF4B6E',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtext: {
        textAlign: 'center',
        color: '#888',
        fontSize: 14,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#FF4B6E',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1E1E2E',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    modalEmoji: {
        fontSize: 64,
        marginBottom: 16,
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
        width: '100%',
    },
    detailLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    detailValue: {
        fontSize: 16,
        color: '#fff',
        lineHeight: 24,
    },
    sendButton: {
        width: '100%',
        marginBottom: 12,
    },
    sendButtonGradient: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.7,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 12,
    },
    closeButtonText: {
        color: '#888',
        fontSize: 16,
    },
});
