import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Analytics() {
    const router = useRouter();

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
                <View style={styles.headerContent}>
                    <Text style={styles.headerIcon}>📊</Text>
                    <Text style={styles.headerTitle}>Analytics</Text>
                    <Text style={styles.headerSubtitle}>View your insights</Text>
                </View>
            </LinearGradient>

            {/* Coming Soon */}
            <View style={styles.comingSoon}>
                <View style={styles.comingSoonIcon}>
                    <Text style={styles.comingSoonEmoji}>🚧</Text>
                </View>
                <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
                <Text style={styles.comingSoonText}>
                    Analytics with streak history, category breakdown, and completion metrics will be available soon.
                </Text>
            </View>

            {/* Stats Preview */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>What's Coming:</Text>

                <View style={styles.featureCard}>
                    <LinearGradient
                        colors={['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.2)']}
                        style={styles.featureGradient}
                    >
                        <Text style={styles.featureIcon}>📈</Text>
                        <Text style={styles.featureTitle}>Streak History</Text>
                        <Text style={styles.featureText}>Track your daily progress</Text>
                    </LinearGradient>
                </View>

                <View style={styles.featureCard}>
                    <LinearGradient
                        colors={['rgba(236, 72, 153, 0.2)', 'rgba(252, 165, 165, 0.2)']}
                        style={styles.featureGradient}
                    >
                        <Text style={styles.featureIcon}>🎨</Text>
                        <Text style={styles.featureTitle}>Category Breakdown</Text>
                        <Text style={styles.featureText}>See which challenges you love</Text>
                    </LinearGradient>
                </View>

                <View style={styles.featureCard}>
                    <LinearGradient
                        colors={['rgba(34, 197, 94, 0.2)', 'rgba(129, 199, 132, 0.2)']}
                        style={styles.featureGradient}
                    >
                        <Text style={styles.featureIcon}>📊</Text>
                        <Text style={styles.featureTitle}>Completion Metrics</Text>
                        <Text style={styles.featureText}>Monitor your success rate</Text>
                    </LinearGradient>
                </View>
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
    headerContent: {
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    comingSoon: {
        margin: 20,
        padding: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    comingSoonIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(236, 72, 153, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    comingSoonEmoji: {
        fontSize: 40,
    },
    comingSoonTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    comingSoonText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        padding: 20,
        paddingTop: 0,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    featureCard: {
        marginBottom: 12,
    },
    featureGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    featureIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
        flex: 1,
    },
    featureText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
    },
});
