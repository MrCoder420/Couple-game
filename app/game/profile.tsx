import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Profile() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { roomId } = useLocalSearchParams();

    const handleSignOut = async () => {
        await signOut();
        router.replace('/auth/login');
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
            </LinearGradient>

            {/* User Info */}
            <View style={styles.section}>
                <View style={styles.profileCard}>
                    <LinearGradient
                        colors={['#8B5CF6', '#EC4899']}
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || 'U'}</Text>
                    </LinearGradient>

                    <Text style={styles.displayName}>{user?.email?.split('@')[0] || 'User'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <Text style={styles.memberSince}>Member since {new Date().toLocaleDateString()}</Text>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.section}>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/game?roomId=${roomId}`)}>
                    <View style={styles.actionContent}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.actionIcon}>🏠</Text>
                        </View>
                        <Text style={styles.actionText}>Back to Dashboard</Text>
                    </View>
                    <Text style={styles.actionArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={handleSignOut}>
                    <View style={styles.actionContent}>
                        <View style={[styles.iconContainer, styles.iconDanger]}>
                            <Text style={styles.actionIcon}>🚪</Text>
                        </View>
                        <Text style={[styles.actionText, styles.actionTextDanger]}>Sign Out</Text>
                    </View>
                    <Text style={styles.actionArrow}>→</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F1E',
    },
    header: {
        padding: 24,
        paddingTop: 60,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backButton: {
        marginBottom: 16,
    },
    backText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    section: {
        padding: 20,
    },
    profileCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    displayName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 8,
    },
    memberSince: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconDanger: {
        backgroundColor: 'rgba(244, 67, 54, 0.3)',
    },
    actionIcon: {
        fontSize: 20,
    },
    actionText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    actionTextDanger: {
        color: '#F44336',
    },
    actionArrow: {
        fontSize: 20,
        color: 'rgba(255, 255, 255, 0.5)',
    },
});
