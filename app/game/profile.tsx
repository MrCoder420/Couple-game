import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function Profile() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(true);

    const handleSignOut = async () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace('/');
                    }
                }
            ]
        );
    };

    return (
        <LinearGradient
            colors={['#0F0F1E', '#1A101F']}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="pencil" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <LinearGradient
                        colors={['rgba(255, 75, 110, 0.2)', 'rgba(255, 75, 110, 0.05)']}
                        style={styles.avatarGlow}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || 'U'}</Text>
                        </View>
                    </LinearGradient>
                    <Text style={styles.emailText}>{user?.email}</Text>
                    <View style={styles.memberBadge}>
                        <Ionicons name="calendar-outline" size={12} color="#888" />
                        <Text style={styles.memberText}>Member since Jan 2026</Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <LinearGradient
                        colors={['#2A1A2E', '#1A101F']}
                        style={styles.statCard}
                    >
                        <Ionicons name="heart" size={24} color="#FF4B6E" style={styles.statIcon} />
                        <Text style={styles.statLabel}>Waiting</Text>
                        <Text style={styles.statSub}>Status</Text>
                    </LinearGradient>
                    <LinearGradient
                        colors={['#2A1A2E', '#1A101F']}
                        style={styles.statCard}
                    >
                        <Ionicons name="flame" size={24} color="#FF9800" style={styles.statIcon} />
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statSub}>Streak</Text>
                    </LinearGradient>
                    <LinearGradient
                        colors={['#2A1A2E', '#1A101F']}
                        style={styles.statCard}
                    >
                        <Ionicons name="game-controller" size={24} color="#2196F3" style={styles.statIcon} />
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statSub}>Games</Text>
                    </LinearGradient>
                </View>

                {/* Settings Section */}
                <Text style={styles.sectionTitle}>Settings</Text>

                <LinearGradient
                    colors={['#2A1A2E', '#1A101F']}
                    style={styles.settingsContainer}
                >
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={styles.iconBox}>
                                <Ionicons name="notifications" size={20} color="#5C94FF" />
                            </View>
                            <Text style={styles.settingLabel}>Notifications</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#333', true: '#2196F3' }}
                            thumbColor="#FFF"
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 152, 0, 0.2)' }]}>
                                <Ionicons name="volume-high" size={20} color="#FF9800" />
                            </View>
                            <Text style={styles.settingLabel}>Sound Effects</Text>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={setSoundEnabled}
                            trackColor={{ false: '#333', true: '#FF9800' }}
                            thumbColor="#FFF"
                        />
                    </View>

                    <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(158, 158, 158, 0.2)' }]}>
                                <Ionicons name="moon" size={20} color="#DDD" />
                            </View>
                            <Text style={styles.settingLabel}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={darkModeEnabled}
                            onValueChange={setDarkModeEnabled}
                            trackColor={{ false: '#333', true: '#DDD' }}
                            thumbColor="#FFF"
                        />
                    </View>
                </LinearGradient>

                {/* Support Section */}
                <Text style={styles.sectionTitle}>Support</Text>
                <TouchableOpacity>
                    <LinearGradient
                        colors={['#2A1A2E', '#1A101F']}
                        style={styles.supportButton}
                    >
                        <View style={styles.supportLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 67, 54, 0.2)' }]}>
                                <Ionicons name="heart-outline" size={20} color="#F44336" />
                            </View>
                            <Text style={styles.settingLabel}>Help & Support</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity onPress={handleSignOut}>
                    <LinearGradient
                        colors={['rgba(255, 75, 110, 0.1)', 'rgba(255, 75, 110, 0.05)']}
                        style={styles.logoutButton}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#FF4B6E" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    editButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarGlow: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2A1A2F',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FF4B6E',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#FF4B6E',
    },
    emailText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
        marginBottom: 8,
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    memberText: {
        color: '#888',
        fontSize: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        gap: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 75, 110, 0.2)',
    },
    statIcon: {
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    statSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
    },
    settingsContainer: {
        borderRadius: 16,
        padding: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 75, 110, 0.2)',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(92, 148, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '500',
    },
    supportButton: {
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 75, 110, 0.2)',
    },
    supportLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 75, 110, 0.3)',
    },
    logoutText: {
        color: '#FF4B6E',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
