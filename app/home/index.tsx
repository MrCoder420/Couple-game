import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { Play, Users, Clock, Copy, LogOut, Code, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

export default function Home() {
  const { user, logout, switchUser } = useAuth();
  const { game, createGame, joinGame, isLoading, checkChallenges } = useGame();
  const router = useRouter();
  
  const [joinCode, setJoinCode] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<7 | 15 | 30>(7);

  // Poll for game status if in a game
  useEffect(() => {
      if (user?.currentGameId) {
          checkChallenges();
      }
  }, [user]);

  // Navigate to game dashboard if active
  useEffect(() => {
      if (game?.status === 'active') {
          router.replace('/game'); // Will redirect to dashboard if index exists there or handled
      }
  }, [game]);

  const handleCreateGame = async () => {
    try {
      const code = await createGame(selectedDuration);
      Alert.alert('Game Created', `Your code is: ${code}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to create game');
    }
  };

  const handleJoinGame = async () => {
    if (!joinCode) {
        Alert.alert('Error', 'Please enter a game code');
        return;
    }
    try {
      await joinGame(joinCode);
      // Navigation happens via effect
    } catch (e) {
      Alert.alert('Error', 'Invalid code or game full');
    }
  };
  
  const copyCode = async () => {
      if (game?.code) {
          await Clipboard.setStringAsync(game.code);
          Alert.alert('Copied', 'Game code copied to clipboard');
      }
  };

  if (game?.status === 'active') {
      // Just a redirect placeholder visually, effect handles actual nav
      return (
        <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#FF4D6D" />
            <Text style={{color: 'white', marginTop: 20}}>Entering Game...</Text>
        </SafeAreaView>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
            <View>
                <Text style={styles.greeting}>Hello, {user?.name}</Text>
                <Text style={styles.subtitle}>Ready to play?</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.iconButton}>
                <LogOut size={24} color="#666" />
            </TouchableOpacity>
        </View>

        {/* Debug / Dev Tools */}
        <TouchableOpacity style={styles.debugButton} onPress={switchUser}>
            <RefreshCw size={16} color="#FFF" />
            <Text style={styles.debugText}>Switch User (Dev)</Text>
        </TouchableOpacity>

        {game ? (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Waiting for Partner</Text>
                <Text style={styles.cardDesc}>Share this code with your partner:</Text>
                
                <TouchableOpacity style={styles.codeContainer} onPress={copyCode}>
                    <Text style={styles.codeText}>{game.code}</Text>
                    <Copy size={20} color="#FF4D6D" />
                </TouchableOpacity>
                
                <View style={styles.waitingContainer}>
                    <ActivityIndicator color="#FF4D6D" />
                    <Text style={styles.waitingText}>Waiting for them to join...</Text>
                </View>
            </View>
        ) : (
            <>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Start a New Game</Text>
                    <Text style={styles.sectionDesc}>Choose your journey duration:</Text>
                    
                    <View style={styles.durationContainer}>
                        {[7, 15, 30].map((d) => (
                            <TouchableOpacity 
                                key={d} 
                                style={[styles.durationBtn, selectedDuration === d && styles.durationBtnActive]}
                                onPress={() => setSelectedDuration(d as any)}
                            >
                                <Text style={[styles.durationText, selectedDuration === d && styles.durationTextActive]}>
                                    {d} Days
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleCreateGame}
                        disabled={isLoading}
                    >
                        <Play size={24} color="#FFF" fill="#FFF" />
                        <Text style={styles.actionButtonText}>Create Game</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, { marginTop: 32 }]}>
                    <Text style={styles.sectionTitle}>Join Existing Game</Text>
                    <Text style={styles.sectionDesc}>Enter the code from your partner:</Text>
                    
                    <View style={styles.inputContainer}>
                        <Code size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter 6-digit code"
                            placeholderTextColor="#666"
                            value={joinCode}
                            onChangeText={setJoinCode}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={handleJoinGame}
                        disabled={isLoading}
                    >
                        <Users size={24} color="#000" />
                        <Text style={[styles.actionButtonText, { color: '#000' }]}>Join Game</Text>
                    </TouchableOpacity>
                </View>
            </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
  },
  debugButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#333',
      padding: 8,
      borderRadius: 8,
      marginBottom: 24,
      alignSelf: 'flex-start',
      gap: 8
  },
  debugText: {
      color: '#FFF',
      fontSize: 12
  },
  section: {
      marginBottom: 0,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFF',
      marginBottom: 8,
  },
  sectionDesc: {
      fontSize: 14,
      color: '#888',
      marginBottom: 16,
  },
  durationContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
  },
  durationBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#333',
      backgroundColor: '#1A1A1A',
      alignItems: 'center',
  },
  durationBtnActive: {
      borderColor: '#FF4D6D',
      backgroundColor: 'rgba(255, 77, 109, 0.1)',
  },
  durationText: {
      color: '#888',
      fontWeight: '600',
  },
  durationTextActive: {
      color: '#FF4D6D',
  },
  actionButton: {
      flexDirection: 'row',
      backgroundColor: '#FF4D6D',
      padding: 18,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      shadowColor: '#FF4D6D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
  },
  secondaryButton: {
      backgroundColor: '#59C3C3',
      shadowColor: '#59C3C3',
  },
  actionButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
  },
  inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1E1E1E',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#333',
      marginBottom: 24,
      paddingHorizontal: 16,
  },
  inputIcon: {
      marginRight: 12,
  },
  input: {
      flex: 1,
      color: '#FFF',
      fontSize: 18,
      paddingVertical: 16,
      letterSpacing: 2,
  },
  card: {
      backgroundColor: '#1A1A1A',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#333',
  },
  cardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFF',
      marginBottom: 8,
  },
  cardDesc: {
      fontSize: 14,
      color: '#888',
      marginBottom: 24,
  },
  codeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#000',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 16,
      gap: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#333',
  },
  codeText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFF',
      letterSpacing: 4,
  },
  waitingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  waitingText: {
      color: '#888',
      fontSize: 14,
  },
});
