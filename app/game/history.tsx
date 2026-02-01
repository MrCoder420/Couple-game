import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { Challenge, Penalty } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ArrowRightLeft, AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';

const EventItem = ({ event, userId }: { event: Challenge | Penalty, userId: string }) => {
    // Determine type: 'sent_challenge', 'received_challenge', 'penalty_loss', 'penalty_bonus'
    const isChallenge = 'cardId' in event;
    
    if (isChallenge) {
        const c = event as Challenge;
        const isSender = c.senderId === userId;
        const title = isSender ? 'You sent a challenge' : 'Partner sent a challenge';
        const statusColor = c.status === 'accepted' ? '#59C3C3' : c.status === 'rejected' ? '#FF4D6D' : '#888';
        const icon = c.status === 'accepted' ? <CheckCircle size={20} color={statusColor} /> 
                  : c.status === 'rejected' ? <XCircle size={20} color={statusColor} /> 
                  : <AlertTriangle size={20} color={statusColor} />;

        return (
            <View style={styles.item}>
                <View style={[styles.iconBox, { borderColor: statusColor }]}>
                    {icon}
                </View>
                <View style={styles.content}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.desc}>"{c.cardContent}"</Text>
                    <Text style={[styles.date, { color: statusColor }]}>{c.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.time}>{new Date(c.sentAt).toLocaleDateString()}</Text>
            </View>
        );
    } else {
        const p = event as Penalty;
        // Penalty logic: 'lose_card' or 'partner_bonus'
        // If I am target and lose_card -> I Lost Card
        // If I am target and bonus -> I got Bonus? No, penalty target suffers.
        // Wait, Penalty A: Partner loses unused card. Penalty B: Sender gets bonus.
        // Penalty object: targetUserId usually means who gets the BAD effect? 
        // Or who was the 'Partner' that rejected?
        // Let's assume description handles it for now.
        
        return (
            <View style={[styles.item, styles.penaltyItem]}>
                <View style={styles.iconBoxPenalty}>
                    <AlertTriangle size={20} color="#FF9F1C" />
                </View>
                <View style={styles.content}>
                    <Text style={styles.titlePenalty}>PENALTY APPLIED</Text>
                    <Text style={styles.desc}>{p.description}</Text>
                </View>
                <Text style={styles.time}>{new Date(p.appliedAt).toLocaleDateString()}</Text>
            </View>
        );
    }
};

export default function History() {
  const { events } = useGame();
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
          <Text style={styles.headerTitle}>Game History</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <X size={24} color="#FFF" />
          </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <EventItem event={item} userId={user.id} />}
        ListEmptyComponent={
            <Text style={styles.emptyText}>No events yet. Start playing!</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeBtn: {
      padding: 8,
      backgroundColor: '#333',
      borderRadius: 20,
  },
  list: {
      padding: 24,
  },
  item: {
      flexDirection: 'row',
      marginBottom: 24,
      alignItems: 'flex-start',
  },
  penaltyItem: {
      opacity: 0.9,
  },
  iconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      backgroundColor: '#1A1A1A',
  },
  iconBoxPenalty: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 159, 28, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      borderWidth: 1,
      borderColor: '#FF9F1C',
  },
  content: {
      flex: 1,
  },
  title: {
      color: '#FFF',
      fontWeight: 'bold',
      marginBottom: 4,
  },
  titlePenalty: {
      color: '#FF9F1C',
      fontWeight: 'bold',
      marginBottom: 4,
  },
  desc: {
      color: '#CCC',
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
  },
  date: {
      fontSize: 12,
      fontWeight: 'bold',
  },
  time: {
      color: '#666',
      fontSize: 12,
      marginLeft: 8,
  },
  emptyText: {
      color: '#666',
      textAlign: 'center',
      marginTop: 48,
  }
});
