import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
    const { user, token, logout } = useAuth();
    const router = useRouter();
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [showJoinRoom, setShowJoinRoom] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [roomHistory, setRoomHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        // Set token first, then load history
        if (token) {
            apiService.setToken(token);
            loadRoomHistory();
        }
    }, [token]);

    const loadRoomHistory = async () => {
        try {
            setHistoryLoading(true);
            const response = await apiService.getMe();
            setRoomHistory(response.rooms || []);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleCreateRoom = async () => {
        setLoading(true);
        try {
            const response = await apiService.createRoom(7);
            console.log('Room created:', response);
            router.push(`/game?roomId=${response.room.id}`);
        } catch (error) {
            console.error('Failed to create room:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomCode || roomCode.length !== 6) {
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.joinRoom(roomCode);
            router.push(`/game?roomId=${response.room.id}`);
        } catch (error) {
            console.error('Failed to join room:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRejoinRoom = async (roomId: string) => {
        console.log('Rejoining room:', roomId);
        // Navigate to game screen with roomId
        router.push(`/game?roomId=${roomId}`);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>💕 Couple Card Game</Text>
                <Text style={styles.subtitle}>Welcome, {user?.displayName}!</Text>
                <TouchableOpacity onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleCreateRoom}
                    disabled={loading}
                >
                    <Text style={styles.primaryButtonText}>+ Create New Room</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setShowJoinRoom(!showJoinRoom)}
                >
                    <Text style={styles.secondaryButtonText}>Join Room with Code</Text>
                </TouchableOpacity>

                {showJoinRoom && (
                    <View style={styles.joinContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter 6-digit code"
                            placeholderTextColor="#999"
                            value={roomCode}
                            onChangeText={setRoomCode}
                            maxLength={6}
                            keyboardType="number-pad"
                        />
                        <TouchableOpacity
                            style={styles.joinButton}
                            onPress={handleJoinRoom}
                            disabled={loading || roomCode.length !== 6}
                        >
                            <Text style={styles.joinButtonText}>Join</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.historySection}>
                <Text style={styles.historyTitle}>🕒 Room History</Text>
                {historyLoading ? (
                    <ActivityIndicator size="large" color="#e94560" style={{ marginTop: 20 }} />
                ) : roomHistory.length === 0 ? (
                    <Text style={styles.emptyText}>No rooms yet. Create or join one!</Text>
                ) : (
                    <FlatList
                        data={roomHistory}
                        keyExtractor={(item) => item.room.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.historyItem}
                                onPress={() => handleRejoinRoom(item.room.id)}
                            >
                                <View>
                                    <Text style={styles.historyCode}>Room: {item.room.code}</Text>
                                    <Text style={styles.historyDate}>
                                        {item.room.status} • {new Date(item.last_accessed).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={styles.arrow}>→</Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
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
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        marginBottom: 10,
    },
    logoutText: {
        color: '#e94560',
        fontSize: 14,
    },
    actions: {
        padding: 20,
    },
    primaryButton: {
        backgroundColor: '#e94560',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginBottom: 15,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#16213e',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e94560',
    },
    secondaryButtonText: {
        color: '#e94560',
        fontSize: 16,
        fontWeight: 'bold',
    },
    joinContainer: {
        marginTop: 15,
        flexDirection: 'row',
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#0f3460',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#e94560',
    },
    joinButton: {
        backgroundColor: '#e94560',
        borderRadius: 12,
        paddingHorizontal: 30,
        justifyContent: 'center',
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    historySection: {
        padding: 20,
        marginTop: 20,
    },
    historyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    emptyText: {
        color: '#999',
        textAlign: 'center',
        padding: 20,
    },
    historyItem: {
        backgroundColor: '#16213e',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    historyCode: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    historyDate: {
        color: '#aaa',
        fontSize: 14,
        marginTop: 5,
    },
    arrow: {
        color: '#e94560',
        fontSize: 20,
    },
});
