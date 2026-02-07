
import StatCard from '@/components/StatCard';
import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/api';
import socketService from '@/services/socket';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useGame } from '@/context/GameContext'; // Import useGame

import { usePushNotifications } from '@/hooks/usePushNotifications'; // Import hook

export default function GameDashboard() {
  const { roomId, newRoom, code } = useLocalSearchParams();
  const { user, token } = useAuth();
  const {
    loadGame,
    checkChallenges
  } = useGame();
  const router = useRouter();

  // Push Notifications
  const { expoPushToken, notification, responseListener } = usePushNotifications();

  const [room, setRoom] = useState<any>(null);
  const [pendingChallenges, setPendingChallenges] = useState<any[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    streak: 0,
    successRate: 100,
    penalties: 0,
    cardsUsed: 0
  });
  const [challengeDay, setChallengeDay] = useState(0);

  // New Game States
  const [joinCode, setJoinCode] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(7);
  const [creatingGame, setCreatingGame] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);

  // Received card notification state
  const [receivedCard, setReceivedCard] = useState<any>(null);
  const [showReceivedCardModal, setShowReceivedCardModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (roomId && token) {
      loadDashboardData();
      connectSocket();
    } else if (token) {
      // Even if no roomId, we stop loading to show "Start/Join" screen
      setLoading(false);
    }

    return () => {
      socketService.disconnect();
    };
  }, [roomId, token]);

  // Register Push Token
  useEffect(() => {
    if (expoPushToken) {
      setTimeout(() => {
        socketService.registerPushToken(expoPushToken);
      }, 2000);
    }
  }, [expoPushToken]);

  // Handle Notifications
  useEffect(() => {
    if (notification) {
      const data = notification.request.content.data;
      if (data && data.type === 'new_challenge' && data.card) {
        setReceivedCard(data.card);
        setShowReceivedCardModal(true);
      }
    }
  }, [notification]);

  useEffect(() => {
    const subscription = import('expo-notifications').then(Notifications => {
      return Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (data && data.type === 'new_challenge' && data.card) {
          setReceivedCard(data.card);
          setShowReceivedCardModal(true);
        }
      });
    });
    return () => { subscription.then(sub => sub.remove()); }
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      if (roomId) {
        // Load Game Context
        loadGame(roomId as string);

        // Load Room Data
        const roomData = await apiService.getRoom(roomId as string);
        setRoom(roomData.room);

        // Load History for Stats
        const history = await apiService.getRoomHistory(roomId as string);

        const pending = history.challenges.filter((c: any) => c.status === 'pending' && c.receiver_id === user?.id);
        const completed = history.challenges.filter((c: any) => c.status === 'accepted');
        const rejected = history.challenges.filter((c: any) => c.status === 'rejected');

        setPendingChallenges(pending);
        setCompletedChallenges(completed);

        const totalChallenges = completed.length + rejected.length;
        const successRate = totalChallenges > 0 ? Math.round((completed.length / totalChallenges) * 100) : 100;

        setStats({
          completed: completed.length,
          pending: pending.length,
          streak: completed.length,
          successRate: successRate,
          penalties: rejected.length,
          cardsUsed: completed.length
        });
        setChallengeDay(completed.length);
      } else {
        // Fallback if no roomId (should be handled by Auth/Home redirect, but just in case)
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const connectSocket = () => {
    if (!token || !roomId) return;
    socketService.connect(token, roomId as string);
    socketService.onPartnerStatus((data) => setPartnerOnline(data.status === 'online'));

    // Auto-refresh when partner joins
    socketService.onPlayerJoined(() => {
      loadDashboardData();
    });

    // Auto-refresh when game is ready
    socketService.onGameReady(() => {
      loadDashboardData();
    });

    socketService.onChallengeReceived((challenge) => {
      Notifications.scheduleNotificationAsync({
        content: {
          title: "New Challenge! 💌",
          body: `${challenge.challengerName || 'Your partner'} sent you a challenge!`,
          data: { type: 'challenge', challengeId: challenge.id },
        },
        trigger: null,
      });
      loadDashboardData();
    });
    socketService.onChallengeOutcome(() => {
      loadDashboardData();
      checkChallenges();
    });
    socketService.onCardReceived((card) => {
      // Trigger Local Notification
      Notifications.scheduleNotificationAsync({
        content: {
          title: "You Received a Card! 💌",
          body: `You got a ${card.type || 'special'} card from your partner!`,
          data: { type: 'new_challenge', card },
        },
        trigger: null,
      });

      setReceivedCard(card);
      setShowReceivedCardModal(true);
    });
  };

  const handleCreateGame = async () => {
    try {
      setCreatingGame(true);
      const newRoom = await apiService.createRoom(selectedDuration);
      router.replace(`/game?roomId=${newRoom.room.id}&newRoom=true&code=${newRoom.room.code}`);
    } catch (error) {
      Alert.alert("Error", "Failed to create game");
    } finally {
      setCreatingGame(false);
    }
  };

  const handleJoinGame = async () => {
    if (!joinCode || joinCode.length < 6) {
      Alert.alert("Invalid Code", "Please enter a valid 6-digit code");
      return;
    }
    try {
      setJoiningGame(true);
      const res = await apiService.joinRoom(joinCode);
      router.replace(`/game?roomId=${res.room.id}`);
    } catch (error) {
      Alert.alert("Error", "Failed to join game. Check the code.");
    } finally {
      setJoiningGame(false);
    }
  };

  const handleCopyCode = async () => {
    // Fallback copy since clipboard might not work in some web views without permissions
    if (room?.code) {
      // In a real app use expo-clipboard
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    await apiService.respondToChallenge(challengeId, 'accept');
    socketService.notifyChallengeResponded(roomId as string, challengeId);
    loadDashboardData();
  };

  const handleRejectChallenge = async (challengeId: string) => {
    await apiService.respondToChallenge(challengeId, 'reject');
    socketService.notifyChallengeResponded(roomId as string, challengeId);
    loadDashboardData();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B6E" />
      </View>
    );
  }

  // --- RENDER STATES ---

  // State 1: Active Game (Has Partner)
  // Logic: Room Exists AND Player 2 exists
  const isGameActive = room && room.player2_id;

  // State 2: Waiting for Partner
  // Logic: Room Exists but NO Player 2
  const isWaiting = room && !room.player2_id;

  // State 3: No Game (Start / Join)
  // Logic: No Room
  const isNoGame = !room;

  console.log('[GameDashboard] Render State:', {
    roomId,
    hasRoom: !!room,
    player2: room?.player2_id,
    isGameActive,
    isWaiting,
    isNoGame
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4B6E" />}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingTitle}>Hi {user?.email?.split('@')[0]}</Text>
            <Text style={styles.greetingSubtitle}>Ready for connection?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push(`/game/profile?roomId=${roomId || ''}`)}
          >
            <LinearGradient
              colors={['#FF4B6E', '#FF7B9C']}
              style={styles.profileAvatar}
            >
              <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase()}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quote Card */}
        <LinearGradient
          colors={['#2A1A2E', '#1A101F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <Text style={styles.quoteIcon}>❝</Text>
          <Text style={styles.quoteText}>"The best thing to hold onto in life is each other."</Text>
          <Text style={styles.quoteAuthor}>- Daily Love</Text>
        </LinearGradient>

        {/* STATE: WAITING FOR PARTNER */}
        {isWaiting && (
          <LinearGradient
            colors={['#2A1A2E', '#1A101F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.waitingHeader}>
              <Text style={styles.cardTitle}>✨ Waiting for Partner</Text>
            </View>
            <Text style={styles.cardSubtitle}>Share this magical code to begin:</Text>

            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{room.code}</Text>
              <TouchableOpacity onPress={handleCopyCode}>
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.waitingLoader}>
              <ActivityIndicator color="#FF4B6E" />
              <Text style={styles.waitingText}>Waiting for connection...</Text>
            </View>

            <TouchableOpacity onPress={() => router.replace('/game')} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back to Dashboard</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* STATE: NO GAME (Start / Join) */}
        {isNoGame && (
          <>
            {/* Start Journey */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Text>▶️</Text>
                </View>
                <Text style={styles.cardTitle}>Start a Journey</Text>
              </View>
              <Text style={styles.cardSubtitle}>Choose the duration of your challenge:</Text>

              <View style={styles.durationContainer}>
                {[7, 15, 30].map(days => (
                  <TouchableOpacity
                    key={days}
                    style={[styles.durationButton, selectedDuration === days && styles.durationButtonActive]}
                    onPress={() => setSelectedDuration(days)}
                  >
                    <Text style={[styles.durationText, selectedDuration === days && styles.durationTextActive]}>
                      {days} Days
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={handleCreateGame} disabled={creatingGame}>
                <LinearGradient
                  colors={['#FF4B6E', '#FF7B9C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>
                    {creatingGame ? 'Creating...' : 'Create Game ❤️'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Join Partner */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Text>👥</Text>
                </View>
                <Text style={styles.cardTitle}>Join Partner</Text>
              </View>
              <Text style={styles.cardSubtitle}>Enter the code shared by your partner:</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>Code:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="000 000"
                  placeholderTextColor="#666"
                  value={joinCode}
                  onChangeText={setJoinCode}
                  maxLength={6}
                  keyboardType="number-pad"
                />
              </View>
              <TouchableOpacity onPress={handleJoinGame} disabled={joiningGame}>
                <LinearGradient
                  colors={['#FF4B6E', '#FF7B9C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>
                    {joiningGame ? 'Joining...' : 'Join Game'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* STATE: ACTIVE GAME */}
        {isGameActive && (
          <>
            {/*  Reuse existing components or styled versions for Active Game */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Your Stats</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  icon="🔥"
                  label="Streak"
                  value={stats.streak}
                  gradientColors={['#FF6B6B', '#FF8E53']} // Keeping existing colors for now or update to Theme
                />
                <StatCard
                  icon="✅"
                  label="Done"
                  value={stats.completed}
                  gradientColors={['#4CAF50', '#81C784']}
                />
              </View>
            </View>

            {/* Quick Actions Restyled */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/game/deck?roomId=${roomId}`)}>
                <LinearGradient colors={['#FF4B6E', '#FF7B9C']} style={styles.actionGradient}>
                  <Text style={styles.actionIcon}>💌</Text>
                  <Text style={styles.actionLabel}>Send Card</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/game/history?roomId=${roomId}`)}>
                <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={styles.actionGradient}>
                  <Text style={styles.actionIcon}>🕐</Text>
                  <Text style={styles.actionLabel}>History</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Pending Challenges */}
            {pendingChallenges.length > 0 && (
              <View style={styles.card}>
                <LinearGradient
                  colors={['rgba(255, 75, 110, 0.2)', 'rgba(255, 75, 110, 0.05)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.iconCircle}>
                    <Text style={{ fontSize: 24 }}>💌</Text>
                  </View>
                  <Text style={styles.cardTitle}>Incoming Challenge!</Text>
                  <Text style={styles.cardSubtitle}>Your partner has sent you a request.</Text>

                  <TouchableOpacity onPress={() => router.push('/game/pending')}>
                    <LinearGradient
                      colors={['#FF4B6E', '#FF7B9C']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>View Challenge</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </>
        )}

        {/* Modals reuse existing logic but need styling updates if time permits */}
      </ScrollView>

      {/* Received Card Modal */}
      {showReceivedCardModal && receivedCard && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>You Received a Card! 💌</Text>
            <Text style={styles.modalSubtitle}>From your partner</Text>

            <View style={styles.receivedCardContent}>
              <Text style={styles.receivedCardEmoji}>
                {receivedCard.type === 'skip' ? '⏭️' :
                  receivedCard.type === 'swap' ? '🔄' :
                    receivedCard.type === 'reverse' ? '↩️' :
                      receivedCard.type === 'shield' ? '🛡️' :
                        receivedCard.type === 'reveal' ? '👁️' : '💌'}
              </Text>
              <Text style={styles.receivedCardTitle}>{receivedCard.title || receivedCard.type}</Text>
              <Text style={styles.receivedCardCategory}>{receivedCard.category || 'Challenge'}</Text>
              <Text style={styles.receivedCardDescription}>
                {receivedCard.content || receivedCard.description}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                if (receivedCard.id) handleAcceptChallenge(receivedCard.id);
                setShowReceivedCardModal(false);
                setReceivedCard(null);
              }}
            >
              <Text style={styles.acceptButtonText}>Accept Challenge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => {
                // If rejected immediately? Or just dismiss view?
                // User asked for "accept or reject". rejection usually means "I won't do it".
                if (receivedCard.id) handleRejectChallenge(receivedCard.id);
                setShowReceivedCardModal(false);
                setReceivedCard(null);
              }}
            >
              <Text style={styles.dismissButtonText}>Reject</Text>
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
  scrollView: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  greetingSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  profileButton: {
    //
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  card: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 110, 0.2)',
  },
  cardGradient: {
    padding: 32,
    borderRadius: 24,
    marginBottom: 24,
  },
  quoteIcon: {
    fontSize: 40,
    color: '#FF4B6E',
    marginBottom: 16,
    opacity: 0.8,
  },
  quoteText: {
    fontSize: 24,
    fontStyle: 'italic',
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 32,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#FF4B6E',
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 75, 110, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
    textAlign: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  durationButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#151525',
  },
  durationButtonActive: {
    borderColor: '#FF4B6E',
    backgroundColor: 'rgba(255, 75, 110, 0.1)',
  },
  durationText: {
    color: '#888',
    fontWeight: '600',
  },
  durationTextActive: {
    color: '#FF4B6E',
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputContainer: {
    backgroundColor: '#1A1015',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 110, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputIcon: {
    color: '#666',
    paddingLeft: 16,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    color: '#FFF',
    padding: 12,
    fontSize: 18,
    letterSpacing: 4,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Waiting State
  waitingHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  codeContainer: {
    backgroundColor: '#1A1015',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 110, 0.1)',
    gap: 16,
  },
  codeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF4B6E',
    letterSpacing: 6,
  },
  copyIcon: {
    fontSize: 20,
  },
  waitingLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  waitingText: {
    color: '#FF4B6E',
    fontSize: 14,
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    color: '#666',
    fontSize: 14,
  },
  // Active Game Extras
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  flexBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  rejectText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  actionCard: {
    flex: 1,
    marginBottom: 12,
  },
  actionGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionLabel: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  // Modal Styles (retained from original, but might need updates for new design)
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
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e94560',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 25,
    textAlign: 'center',
  },
  receivedCardContent: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(233, 69, 96, 0.3)',
  },
  receivedCardEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  receivedCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  receivedCardCategory: {
    fontSize: 14,
    color: '#e94560',
    marginBottom: 12,
  },
  receivedCardDescription: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#aaa',
    fontSize: 16,
  },
});
