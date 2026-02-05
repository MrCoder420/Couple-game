import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ChallengeProgressProps {
    currentDay: number;
    totalDays: number;
    isActive: boolean;
}

export default function ChallengeProgress({ currentDay, totalDays, isActive }: ChallengeProgressProps) {
    const progress = currentDay / totalDays;
    const percentage = Math.round(progress * 100);

    // Animation
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isActive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [isActive]);

    const size = 180;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress * circumference);

    return (
        <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <Svg width={size} height={size} style={styles.svg}>
                    {/* Background circle */}
                    <Circle
                        stroke="rgba(255, 255, 255, 0.1)"
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <Circle
                        stroke="url(#grad)"
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                    />
                </Svg>

                <View style={styles.textContainer}>
                    <Text style={styles.dayText}>Day {currentDay}</Text>
                    <Text style={styles.totalText}>of {totalDays}</Text>
                    <Text style={styles.percentageText}>{percentage}%</Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradient: {
        borderRadius: 100,
        padding: 4,
    },
    svg: {
        position: 'absolute',
    },
    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    totalText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 8,
    },
    percentageText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#EC4899',
    },
});
