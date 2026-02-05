import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CHALLENGES = [
    { id: 1, title: 'Compliment Countdown', description: 'One compliment every minute for 10 mins', category: 'Romance', difficulty: 'Easy', duration: '15-20 min', icon: '💝' },
    { id: 2, title: 'Bouquet Card', description: 'Create a bouquet of compliments instead of flowers', category: 'Romance', difficulty: 'Easy', duration: '15-20 min', icon: '💖' },
    { id: 3, title: 'Life Admin Swap', description: 'Partner takes over one of your routine tasks today', category: 'Service', difficulty: 'Medium', duration: 'Varies', icon: '⭐' },
    { id: 4, title: 'Chore Swap', description: "Do your partner's least favorite chore today", category: 'Service', difficulty: 'Medium', duration: 'Varies', icon: '⭐' },
    { id: 5, title: 'Heart-to-Heart Hour', description: 'Ask 3 deep questions; both must answer honestly', category: 'Communication', difficulty: 'Medium', duration: '30-60 min', icon: '👥' },
    { id: 6, title: 'Ask Me Anything', description: 'Ask 2 unfiltered questions; no dodging allowed', category: 'Communication', difficulty: 'Medium', duration: '15-20 min', icon: '👥' },
    { id: 7, title: 'Comfort King/Queen', description: 'Make the coziest home nook possible', category: 'Fun', difficulty: 'Easy', duration: '20-30 min', icon: '⭐' },
    { id: 8, title: 'Dance Party', description: 'Create a playlist and dance together for 15 minutes', category: 'Fun', difficulty: 'Easy', duration: '15 min', icon: '💃' },
    { id: 9, title: 'Memory Lane', description: 'Share your favorite memory of us together', category: 'Growth', difficulty: 'Easy', duration: '10-20 min', icon: '🌱' },
    { id: 10, title: 'Future Vision', description: 'Describe our life together in 5 years', category: 'Growth', difficulty: 'Medium', duration: '20-30 min', icon: '🌱' },
];

const CATEGORIES = ['All', 'Romance', 'Growth', 'Fun', 'Communication', 'Service'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const getCategoryColor = (category: string) => {
    const colors: any = {
        Romance: ['#EC4899', '#F472B6'],
        Growth: ['#10B981', '#34D399'],
        Fun: ['#F59E0B', '#FBBF24'],
        Communication: ['#3B82F6', '#60A5FA'],
        Service: ['#8B5CF6', '#A78BFA'],
    };
    return colors[category] || ['#6B7280', '#9CA3AF'];
};

export default function BrowseChallenges() {
    const router = useRouter();
    const { roomId } = useLocalSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');

    const filteredChallenges = CHALLENGES.filter(challenge => {
        const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || challenge.category === selectedCategory;
        const matchesDifficulty = selectedDifficulty === 'All' || challenge.difficulty === selectedDifficulty;
        return matchesSearch && matchesCategory && matchesDifficulty;
    });

    return (
        <View style={styles.container}>
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
                <Text style={styles.headerTitle}>Browse Challenges</Text>
                <Text style={styles.headerSubtitle}>{CHALLENGES.length} cards available</Text>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search challenges..."
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filters */}
                <View style={styles.filtersRow}>
                    {/* Category Filter */}
                    <View style={styles.filterContainer}>
                        <Text style={styles.filterLabel}>Category</Text>
                        <View style={styles.filterChips}>
                            {CATEGORIES.map(category => (
                                <TouchableOpacity
                                    key={category}
                                    style={[
                                        styles.filterChip,
                                        selectedCategory === category && styles.filterChipActive
                                    ]}
                                    onPress={() => setSelectedCategory(category)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            selectedCategory === category && styles.filterChipTextActive
                                        ]}
                                    >
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Difficulty Filter */}
                    <View style={styles.filterContainer}>
                        <Text style={styles.filterLabel}>Difficulty</Text>
                        <View style={styles.filterChips}>
                            {DIFFICULTIES.map(difficulty => (
                                <TouchableOpacity
                                    key={difficulty}
                                    style={[
                                        styles.filterChip,
                                        selectedDifficulty === difficulty && styles.filterChipActive
                                    ]}
                                    onPress={() => setSelectedDifficulty(difficulty)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            selectedDifficulty === difficulty && styles.filterChipTextActive
                                        ]}
                                    >
                                        {difficulty}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Challenge Cards */}
                <View style={styles.challengesList}>
                    {filteredChallenges.map(challenge => (
                        <TouchableOpacity key={challenge.id} style={styles.challengeCard}>
                            <LinearGradient
                                colors={[`${getCategoryColor(challenge.category)[0]}33`, `${getCategoryColor(challenge.category)[1]}33`]}
                                style={styles.challengeGradient}
                            >
                                <View style={styles.challengeIconContainer}>
                                    <LinearGradient
                                        colors={getCategoryColor(challenge.category)}
                                        style={styles.challengeIconGradient}
                                    >
                                        <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                                    </LinearGradient>
                                </View>

                                <View style={styles.challengeContent}>
                                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                                    <Text style={styles.challengeDescription}>{challenge.description}</Text>

                                    <View style={styles.challengeMeta}>
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{challenge.difficulty}</Text>
                                        </View>
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>⏱️ {challenge.duration}</Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.sendIcon}>
                                    <Text style={styles.sendIconText}>💌</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {filteredChallenges.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🔍</Text>
                        <Text style={styles.emptyText}>No challenges found</Text>
                        <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                    </View>
                )}
            </ScrollView>
        </View>
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
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    searchIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
    },
    filtersRow: {
        marginBottom: 20,
    },
    filterContainer: {
        marginBottom: 16,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    filterChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    filterChipActive: {
        backgroundColor: 'rgba(236, 72, 153, 0.3)',
        borderColor: '#EC4899',
    },
    filterChipText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    filterChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    challengesList: {
        gap: 12,
    },
    challengeCard: {
        marginBottom: 12,
    },
    challengeGradient: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    challengeIconContainer: {
        marginRight: 12,
    },
    challengeIconGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    challengeIcon: {
        fontSize: 24,
    },
    challengeContent: {
        flex: 1,
    },
    challengeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    challengeDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 8,
    },
    challengeMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    badgeText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    sendIcon: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIconText: {
        fontSize: 24,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
    },
});
