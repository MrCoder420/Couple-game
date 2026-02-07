import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SVGLinearGradient, Stop } from 'react-native-svg';

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

    const size = 200; // Increased size slightly for better visibility
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress * circumference);

    return (
        <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={size} height={size} style={styles.svg}>
                    <Defs>
                        <SVGLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0" stopColor="#8B5CF6" />
                            <Stop offset="100%" stopColor="#EC4899" />
                        </SVGLinearGradient>
                    </Defs>

                    {/* Background circle */}
                    <Circle
                        stroke="rgba(255, 255, 255, 0.15)"
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <Circle
                        stroke="url(#grad)" // Now references the Defs above
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
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        position: 'absolute',
        top: 0,
        left: 0,
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
