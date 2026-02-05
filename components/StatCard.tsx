import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
    icon: string;
    label: string;
    value: string | number;
    gradientColors: string[];
}

export default function StatCard({ icon, label, value, gradientColors }: StatCardProps) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
            >
                <Text style={styles.icon}>{icon}</Text>
            </LinearGradient>

            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        minWidth: 100,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        fontSize: 24,
    },
    value: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
});
