import ChallengeProgress from '@/components/ChallengeProgress';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/api';
import socketService from '@/services/socket';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GameDashboard() {
  const { roomId } = useLocalSearchParams();
  const { user, token } = useAuth();
  const router = useRouter();

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

  useEffect(() => {
    if (!roomId || !token) return;

    loadDashboardData();
    connectSocket();

    return () => {
      socketService.disconnect();
    };
  }, [roomId, token]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get room data
      const roomData = await apiService.getRoom(roomId as string);
      setRoom(roomData.room);

      // Get all challenges
      const history = await apiService.getRoomHistory(roomId as string);

      const pending = history.challenges.filter((c: any) => c.status === 'pending' && c.receiver_id === user?.id);
      const completed = history.challenges.filter((c: any) => c.status === 'accepted');
      const rejected = history.challenges.filter((c: any) => c.status === 'rejected');

      setPendingChallenges(pending);
      setCompletedChallenges(completed);

      // Calculate stats
      const totalChallenges = completed.length + rejected.length;
      const successRate = totalChallenges > 0 ? Math.round((completed.length / totalChallenges) * 100) : 100;

      setStats({
        completed: completed.length,
        pending: pending.length,
        streak: completed.length, // Simplified - can calculate actual streak later
        successRate: successRate,
        penalties: rejected.length,
        cardsUsed: completed.length
      });

      // Set challenge day (simplified)
      setChallengeDay(completed.length);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const connectSocket = () => {
    if (!token) return;

    socketService.connect(token, roomId as string);

    socketService.onPartnerStatus((data) => {
      setPartnerOnline(data.status === 'online');
    });

    socketService.onChallengeReceived((challenge) => {
      setPendingChallenges(prev => [challenge, ...prev]);
      setStats(s => ({ ...s, pending: s.pending + 1 }));
    });

    socketService.onChallengeOutcome(() => {
      loadDashboardData();
    });
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await apiService.respondToChallenge(challengeId, 'accept');
      socketService.notifyChallengeResponded(roomId as string, challengeId);
      loadDashboardData();
    } catch (error) {
      console.error('Failed to accept challenge:', error);
    }
  };

  const handleRejectChallenge = async (challengeId: string) => {
    try {
      await apiService.respondToChallenge(challengeId, 'reject');
      socketService.notifyChallengeResponded(roomId as string, challengeId);
      loadDashboardData();
    } catch (error) {
      console.error('Failed to reject challenge:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const partnerName = room?.player1_id === user?.id
    ? room?.player2_email?.split('@')[0]
    : room?.player1_email?.split('@')[0];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EC4899" />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.push('/game/profile')} style={styles.profileIcon}>
          <Text style={styles.profileIconText}>👤</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.heartIcon}>
            <Text style={styles.heartEmoji}>💖</Text>
          </View>
          <Text style={styles.partnerName}>with {partnerName || 'Partner'}</Text>
          <Text style={styles.greeting}>Hey, {user?.email?.split('@')[0]}! 👋</Text>
          <Text style={styles.subtitle}>Ready to make today special?</Text>
        </View>
      </LinearGradient>

      {/* 30-Day Challenge Card */}
      <View style={styles.section}>
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeTitleContainer}>
              <Text style={styles.challengeIcon}>🔥</Text>
              <View>
                <Text style={styles.challengeTitle}>30-Day Challenge</Text>
                <Text style={styles.challengeSubtitle}>Keep the spark alive! 🔥</Text>
              </View>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>{Math.round((challengeDay / 30) * 100)}%</Text>
              <Text style={styles.progressLabel}>complete</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <ChallengeProgress
              currentDay={challengeDay}
              totalDays={30}
              isActive={true}
            />
          </View>

          <Text style={styles.motivationText}>
            {challengeDay === 0 ? '30 days remaining • Keep the spark alive!' : `${30 - challengeDay} days remaining • Keep going! 💪`}
          </Text>

          {challengeDay === 0 && (
            <TouchableOpacity style={styles.startButton}>
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>🚀 Start Challenge</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Statistics Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Your Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="🔥"
            label="Streak"
            value={stats.streak}
            gradientColors={['#FF6B6B', '#FF8E53']}
          />
          <StatCard
            icon="✅"
            label="Done"
            value={stats.completed}
            gradientColors={['#4CAF50', '#81C784']}
          />
          <StatCard
            icon="📊"
            label="Success"
            value={`${stats.successRate}%`}
            gradientColors={['#8B5CF6', '#B794F4']}
          />
          <StatCard
            icon="⚠️"
            label="Penalties"
            value={stats.penalties}
            gradientColors={['#F44336', '#E57373']}
          />
          <StatCard
            icon="🎴"
            label="Cards"
            value={`${stats.cardsUsed}/30`}
            gradientColors={['#EC4899', '#F472B6']}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/game/browse?roomId=${roomId}`)}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.2)']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>🎴</Text>
              <Text style={styles.actionLabel}>Browse Challenges</Text>
              <Text style={styles.actionSubtext}>30 cards available</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/game/deck?roomId=${roomId}`)}>
            <LinearGradient
              colors={['rgba(236, 72, 153, 0.2)', 'rgba(252, 165, 165, 0.2)']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>📚</Text>
              <Text style={styles.actionLabel}>Deck</Text>
              <Text style={styles.actionSubtext}>View your cards</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/game/analytics?roomId=${roomId}`)}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.2)', 'rgba(129, 199, 132, 0.2)']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>Analytics</Text>
              <Text style={styles.actionSubtext}>View insights</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>🕐</Text>
              <Text style={styles.actionLabel}>History</Text>
              <Text style={styles.actionSubtext}>Past challenges</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ready for a Challenge Section */}
      {pendingChallenges.length === 0 && (
        <View style={styles.section}>
          <View style={styles.readyCard}>
            <View style={styles.heartPulse}>
              <Text style={styles.heartPulseText}>💖</Text>
            </View>
            <Text style={styles.readyTitle}>Ready for a Challenge?</Text>
            <Text style={styles.readySubtitle}>
              Send a challenge to {partnerName} and make today unforgettable!
            </Text>
            <TouchableOpacity style={styles.sendButton} onPress={() => router.push(`/game/browse?roomId=${roomId}`)}>
              <LinearGradient
                colors={['#EC4899', '#F472B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <Text style={styles.sendButtonText}>➕ Send a Challenge</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Pending Challenges */}
      {pendingChallenges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💌 Pending Challenges ({pendingChallenges.length})</Text>
          {pendingChallenges.map(challenge => (
            <View key={challenge.id} style={styles.challengeItem}>
              <LinearGradient
                colors={['rgba(236, 72, 153, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                style={styles.challengeItemGradient}
              >
                <Text style={styles.challengeText}>{challenge.card_content}</Text>
                <Text style={styles.challengeFrom}>From: {challenge.sender_id === room?.player1_id ? room.player1_email : room.player2_email}</Text>
                <View style={styles.challengeActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAcceptChallenge(challenge.id)}
                  >
                    <Text style={styles.actionButtonText}>✓ Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectChallenge(challenge.id)}
                  >
                    <Text style={styles.actionButtonText}>✗ Reject</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>
      )}

      {/* Completed Challenges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ Completed ({completedChallenges.length})</Text>
        {completedChallenges.length === 0 ? (
          <Text style={styles.emptyText}>No completed challenges yet!</Text>
        ) : (
          completedChallenges.slice(0, 5).map(challenge => (
            <View key={challenge.id} style={styles.historyCard}>
              <Text style={styles.historyText}>{challenge.card_content}</Text>
              <Text style={styles.historyDate}>
                Completed: {new Date(challenge.responded_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Partner Status */}
      <View style={styles.partnerStatus}>
        <View style={[styles.statusDot, partnerOnline && styles.statusDotOnline]} />
        <Text style={styles.statusText}>
          {partnerName} is {partnerOnline ? 'online' : 'offline'}
        </Text>
      </View>
    </ScrollView>
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
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileIcon: {
    position: 'absolute',
    right: 24,
    top: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  heartIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heartEmoji: {
    fontSize: 28,
  },
  partnerName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  challengeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  challengeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeIcon: {
    fontSize: 32,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  challengeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EC4899',
  },
  progressLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  motivationText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 12,
  },
  startButton: {
    marginTop: 16,
  },
  startButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
  },
  actionGradient: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  readyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heartPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartPulseText: {
    fontSize: 40,
  },
  readyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  readySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  sendButton: {
    width: '100%',
  },
  sendButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  challengeItem: {
    marginBottom: 12,
  },
  challengeItemGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  challengeText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  challengeFrom: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  challengeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    padding: 20,
  },
  partnerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  statusDotOnline: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
