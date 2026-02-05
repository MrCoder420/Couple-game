import { useGame } from '@/context/GameContext';
import { useRouter } from 'expo-router';
import { AlertTriangle, Check, MessageCircle, X } from 'lucide-react-native';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PendingChallenge() {
    const { pendingChallenges, respondToChallenge } = useGame();
    const router = useRouter();

    if (pendingChallenges.length === 0) {
        // No challenges? Go back
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No pending challenges!</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.btnText}>Return to Game</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const challenge = pendingChallenges[0]; // Show first one

    const handleAccept = async () => {
        await respondToChallenge(challenge.id, 'accept');
        Alert.alert("Accepted!", "You have accepted the challenge. Good luck!");
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
            <View style={styles.header}>
                <Text style={styles.title}>INCOMING CHALLENGE</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <MessageCircle size={60} color="#FF4D6D" />
                </View>
                <Text style={styles.challengeText}>"{challenge.cardContent}"</Text>
                <Text style={styles.subText}>Partner is waiting...</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={handleReject}>
                    <X size={24} color="#FFF" />
                    <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={handleAccept}>
                    <Check size={24} color="#FFF" />
                    <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.warningBox}>
                <AlertTriangle size={16} color="#FF9F1C" />
                <Text style={styles.warningText}>Rejecting may cause a PENALTY!</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
        padding: 24,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        marginBottom: 48,
        borderWidth: 1,
        borderColor: '#333',
    },
    iconContainer: {
        marginBottom: 24,
    },
    challengeText: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 30,
    },
    subText: {
        color: '#888',
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    btn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    rejectBtn: {
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#FF4D6D',
    },
    acceptBtn: {
        backgroundColor: '#06D6A0',
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
        marginTop: 24,
        gap: 8,
    },
    warningText: {
        color: '#FF9F1C',
        fontSize: 12,
    },
    emptyText: {
        color: '#FFF',
        fontSize: 18,
        marginBottom: 24,
    },
    backBtn: {
        padding: 16,
        backgroundColor: '#333',
        borderRadius: 12,
    }
});
