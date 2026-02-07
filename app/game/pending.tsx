import { useGame } from '@/context/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AlertTriangle, Check, MessageCircle, X } from 'lucide-react-native';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PendingChallenge() {
    const { pendingChallenges, respondToChallenge } = useGame();
    const router = useRouter();

    if (pendingChallenges.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#0F0F1E', '#1A1A2E']}
                    style={styles.background}
                />
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No pending challenges!</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.btnText}>Return to Game</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const challenge = pendingChallenges[0];

    const handleAccept = async () => {
        await respondToChallenge(challenge.id, 'accept');
        router.back();
    };

    const handleReject = async () => {
        Alert.alert(
            "Reject Challenge?",
            "Warning: You might lose a card or give your partner a bonus!",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject & Risk Penalty",
                    style: "destructive",
                    onPress: async () => {
                        await respondToChallenge(challenge.id, 'reject');
                        router.back();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#0F0F1E', '#1A101F']}
                style={styles.background}
            />

            <View style={styles.header}>
                <Text style={styles.title}>INCOMING CHALLENGE</Text>
                <Text style={styles.subtitle}>Your partner sent you a card!</Text>
            </View>

            <View style={styles.cardContainer}>
                <LinearGradient
                    colors={['#2A1A2E', '#1A101F']}
                    style={styles.card}
                >
                    <View style={styles.iconContainer}>
                        <MessageCircle size={60} color="#FF4B6E" />
                    </View>
                    <Text style={styles.challengeText}>"{challenge.cardContent}"</Text>
                    <Text style={styles.subText}>Waiting for your response...</Text>
                </LinearGradient>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.flexBtn} onPress={handleReject}>
                    <View style={styles.rejectBtn}>
                        <X size={24} color="#FFF" />
                        <Text style={styles.btnText}>Reject</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.flexBtn} onPress={handleAccept}>
                    <LinearGradient
                        colors={['#4CAF50', '#66BB6A']}
                        style={styles.acceptBtn}
                    >
                        <Check size={24} color="#FFF" />
                        <Text style={styles.btnText}>Accept</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <View style={styles.warningBox}>
                <AlertTriangle size={16} color="#FFB74D" />
                <Text style={styles.warningText}>Rejecting may incur a PENALTY</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F1E',
        padding: 24,
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 48,
    },
    title: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
    },
    subtitle: {
        color: '#AAA',
        fontSize: 16,
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        marginBottom: 40,
    },
    card: {
        borderRadius: 32,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 75, 110, 0.2)',
        width: '100%',
    },
    iconContainer: {
        marginBottom: 32,
        shadowColor: '#FF4B6E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    challengeText: {
        color: '#FFF',
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 34,
    },
    subText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginTop: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    flexBtn: {
        flex: 1,
    },
    rejectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        gap: 8,
    },
    acceptBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 16,
        gap: 8,
    },
    btnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    warningBox: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        opacity: 0.8,
    },
    warningText: {
        color: '#FFB74D',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    emptyText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    backBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#333',
        borderRadius: 12,
    }
});
