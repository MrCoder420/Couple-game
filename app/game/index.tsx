import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, RefreshCw, Eye, CornerUpLeft, ArrowRightLeft, MessageCircle, Heart, Bell } from 'lucide-react-native';
import { Card, CardType } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 24) / 3; // 3 columns

const CardIcon = ({ type }: { type: CardType }) => {
    switch (type) {
        case 'skip': return <CornerUpLeft color="#FFF" size={24} />;
        case 'swap': return <ArrowRightLeft color="#FFF" size={24} />;
        case 'reverse': return <RefreshCw color="#FFF" size={24} />;
        case 'shield': return <Shield color="#FFF" size={24} />;
        case 'reveal': return <Eye color="#FFF" size={24} />;
        case 'action': return <Heart color="#FFF" size={24} />;
        default: return <MessageCircle color="#FFF" size={24} />;
    }
};

const CardItem = ({ card, onPress, disabled }: { card: Card, onPress: () => void, disabled: boolean }) => {
    const isSpecial = card.isFixed;
    const bgColor = disabled 
        ? '#1A1A1A' 
        : isSpecial 
            ? '#FF4D6D' 
            : '#59C3C3';
    
    return (
        <TouchableOpacity 
            style={[styles.cardItem, { backgroundColor: bgColor, opacity: disabled ? 0.5 : 1 }]}
            onPress={onPress}
            disabled={disabled}
        >
            <CardIcon type={card.type} />
            <Text style={styles.cardLabel}>{card.type.toUpperCase()}</Text>
        </TouchableOpacity>
    );
};

export default function GameDashboard() {
  const { game, deck, pendingChallenges, checkChallenges, respondToChallenge } = useGame();
  const { user } = useAuth();
  const router = useRouter();

  // Poll for updates
  useEffect(() => {
      checkChallenges();
      const interval = setInterval(checkChallenges, 5000);
      return () => clearInterval(interval);
  }, []);

  const handleCardPress = (card: Card) => {
      router.push(`/game/card/${card.id}`);
  };
  
  const handlePendingChallenge = () => {
      if (pendingChallenges.length === 0) return;
      const challenge = pendingChallenges[0];
      
      Alert.alert(
          'Incoming Challenge!',
          `Partner sent: "${challenge.cardContent}"`,
          [
              { text: 'Reject (-Penalty)', style: 'destructive', onPress: () => respondToChallenge(challenge.id, 'reject') },
              { text: 'Accept await', onPress: () => respondToChallenge(challenge.id, 'accept') },
          ]
      );
  };

  if (!game || !deck) return null;

  const sortedCards = [...deck.cards].sort((a, b) => {
      // Sort: Used last, then specials first
      const aUsed = deck.usedCardIds.includes(a.id);
      const bUsed = deck.usedCardIds.includes(b.id);
      if (aUsed && !bUsed) return 1;
      if (!aUsed && bUsed) return -1;
      if (a.isFixed && !b.isFixed) return -1;
      if (!a.isFixed && b.isFixed) return 1;
      return 0;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
          <View>
              <Text style={styles.headerTitle}>Day 1 of {game.duration}</Text>
              <Text style={styles.headerSub}>{deck.cards.length - deck.usedCardIds.length} Cards Left</Text>
          </View>
          
          {pendingChallenges.length > 0 && (
              <TouchableOpacity style={styles.bellBtn} onPress={handlePendingChallenge}>
                  <Bell color="#FF4D6D" fill="#FF4D6D" size={24} />
                  <View style={styles.badge} />
              </TouchableOpacity>
          )}
      </View>

      <FlatList
        data={sortedCards}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
            <CardItem 
                card={item} 
                onPress={() => handleCardPress(item)} 
                disabled={deck.usedCardIds.includes(item.id)}
            />
        )}
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
  headerSub: {
    fontSize: 14,
    color: '#666',
  },
  bellBtn: {
    padding: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 50,
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  grid: {
    padding: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardItem: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLabel: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center'
  }
});
