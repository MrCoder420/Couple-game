import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { CardType } from '@/types';
import { Shield, RefreshCw, Eye, CornerUpLeft, ArrowRightLeft, MessageCircle, Heart, Send, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CardIcon = ({ type, size = 64 }: { type: CardType, size?: number }) => {
    switch (type) {
        case 'skip': return <CornerUpLeft color="#FFF" size={size} />;
        case 'swap': return <ArrowRightLeft color="#FFF" size={size} />;
        case 'reverse': return <RefreshCw color="#FFF" size={size} />;
        case 'shield': return <Shield color="#FFF" size={size} />;
        case 'reveal': return <Eye color="#FFF" size={size} />;
        case 'action': return <Heart color="#FFF" size={size} />;
        default: return <MessageCircle color="#FFF" size={size} />;
    }
};

export default function CardDetail() {
  const { id } = useLocalSearchParams();
  const { deck, sendCard, isLoading } = useGame();
  const router = useRouter();

  const card = deck?.cards.find(c => c.id === id);

  if (!card) {
      return (
          <View style={styles.container}>
              <Text style={{color: 'white'}}>Card not found</Text>
          </View>
      );
  }

  const isUsed = deck?.usedCardIds.includes(card.id);

  const handleSend = async () => {
    Alert.alert(
        'Send Challenge?',
        'Once sent, this card will be consumed from your deck.',
        [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Send to Partner', 
                onPress: async () => {
                    await sendCard(card);
                    Alert.alert('Sent!', 'Your partner has received the challenge.');
                    router.back();
                }
            }
        ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <X size={24} color="#FFF" />
          </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.cardLarge, isUsed && styles.cardUsed]}>
             <CardIcon type={card.type} size={80} />
             <Text style={styles.cardType}>{card.type.toUpperCase()}</Text>
             <Text style={styles.cardText}>{card.content}</Text>
        </View>
        
        {isUsed ? (
            <View style={styles.usedBadge}>
                <Text style={styles.usedText}>ALREADY USED</Text>
            </View>
        ) : (
            <TouchableOpacity 
                style={[styles.sendButton, isLoading && styles.btnDisabled]} 
                onPress={handleSend}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        <Send size={24} color="#FFF" />
                        <Text style={styles.btnText}>Send Challenge</Text>
                    </>
                )}
            </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
      padding: 16,
      alignItems: 'flex-end',
  },
  closeBtn: {
      padding: 8,
      backgroundColor: '#333',
      borderRadius: 20,
  },
  content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 32,
      justifyContent: 'center',
      paddingBottom: 80, 
  },
  cardLarge: {
      width: '100%',
      aspectRatio: 3/4,
      backgroundColor: '#1E1E1E',
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      borderWidth: 1,
      borderColor: '#333',
      marginBottom: 48,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
  },
  cardUsed: {
      opacity: 0.5,
      borderColor: '#666',
  },
  cardType: {
      color: '#FF4D6D',
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 24,
      marginBottom: 16,
      letterSpacing: 2,
  },
  cardText: {
      color: '#FFF',
      fontSize: 24,
      textAlign: 'center',
      lineHeight: 32,
      fontWeight: '500'
  },
  sendButton: {
      flexDirection: 'row',
      backgroundColor: '#FF4D6D',
      paddingVertical: 18,
      paddingHorizontal: 48,
      borderRadius: 50,
      alignItems: 'center',
      gap: 12,
      shadowColor: '#FF4D6D',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
  },
  btnDisabled: {
      opacity: 0.7
  },
  btnText: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: 'bold',
  },
  usedBadge: {
      backgroundColor: '#333',
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 50,
  },
  usedText: {
      color: '#888',
      fontWeight: 'bold',
      letterSpacing: 2,
  }
});
