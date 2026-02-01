import { Card, CardType, Challenge, Game, GameDuration, Penalty, PlayerDeck, User } from '../types';

// Mock Data Pools
const ACTION_CARDS = [
  "Cook a special dinner tonight.",
  "Give a 10-minute massage.",
  "Write a love letter.",
  "Plan a surprise date.",
  "No phones for 2 hours tonight.",
  "Slow dance to our favorite song.",
  // ... add more for pool
];

const QUESTION_CARDS = [
  "What is your favorite memory of us?",
  "What is one thing you want to achieve this year?",
  "When did you first know you loved me?",
  "What is your biggest fear?",
  // ... add more
];

class MockGameService {
  private games: Game[] = [];
  private decks: Record<string, PlayerDeck> = {}; // gameId_userId -> Deck
  private challenges: Challenge[] = [];
  private penalties: Penalty[] = [];

  // --- Game Management ---

  async createGame(hostUserId: string, duration: GameDuration): Promise<Game> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const newGame: Game = {
      id: 'game_' + Date.now(),
      code,
      player1Id: hostUserId,
      startDate: new Date().toISOString(),
      duration,
      status: 'waiting_for_partner',
    };
    this.games.push(newGame);
    return newGame;
  }

  async joinGame(userId: string, code: string): Promise<Game> {
    const game = this.games.find(g => g.code === code && g.status === 'waiting_for_partner');
    if (!game) throw new Error('Invalid or full game code');

    game.player2Id = userId;
    game.status = 'active';
    
    // Generate Decks for both players
    this.generateDeck(game.id, game.player1Id);
    this.generateDeck(game.id, userId);

    return game;
  }

  async getGamestate(gameId: string): Promise<Game | undefined> {
    return this.games.find(g => g.id === gameId);
  }

  // --- Card Logic ---

  private generateDeck(gameId: string, userId: string) {
    const cards: Card[] = [];
    
    // 1. Add 5 Fixed Cards
    const fixedTypes: CardType[] = ['skip', 'swap', 'reverse', 'shield', 'reveal'];
    fixedTypes.forEach(type => {
      cards.push({
        id: `card_${userId}_${type}`,
        type,
        content: `Use this to ${type} a challenge!`,
        isFixed: true,
      });
    });

    // 2. Add 25 Random Cards
    // In a real app, this would pick unique ones from a DB
    for (let i = 0; i < 25; i++) {
      const isAction = Math.random() > 0.5;
      const pool = isAction ? ACTION_CARDS : QUESTION_CARDS;
      const content = pool[Math.floor(Math.random() * pool.length)]; // simplified random
      cards.push({
        id: `card_${userId}_${i}`,
        type: isAction ? 'action' : 'question',
        content,
        isFixed: false,
      });
    }

    this.decks[`${gameId}_${userId}`] = {
      userId,
      cards,
      usedCardIds: [],
    };
  }

  async getPlayerDeck(gameId: string, userId: string): Promise<PlayerDeck> {
    return this.decks[`${gameId}_${userId}`];
  }

  // --- Challenge Logic ---

  async sendChallenge(gameId: string, senderId: string, receiverId: string, card: Card): Promise<Challenge> {
    const challenge: Challenge = {
      id: 'ch_' + Date.now(),
      gameId,
      senderId,
      receiverId,
      cardId: card.id,
      cardContent: card.content,
      status: 'pending',
      sentAt: new Date().toISOString(),
    };
    this.challenges.push(challenge);
    
    // Mark card as used immediately? Requirements say "Card is consumed"
    // Usually better to mark consumed on send to prevent double send
    const deckKey = `${gameId}_${senderId}`;
    if (this.decks[deckKey]) {
        this.decks[deckKey].usedCardIds.push(card.id);
    }
    
    return challenge;
  }

  async getPendingChallenges(gameId: string, userId: string): Promise<Challenge[]> {
    // Check for timeouts first
    const now = new Date();
    const TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
    // For testing purposes, make it 2 minutes if needed, but per specs 24h.
    
    this.challenges.forEach(c => {
        if (c.status === 'pending' && c.gameId === gameId) {
            const sentTime = new Date(c.sentAt).getTime();
            if (now.getTime() - sentTime > TIMEOUT_MS) {
                // Timeout!
                c.status = 'expired';
                c.respondedAt = now.toISOString();
                this.applyPenalty(c);
            }
        }
    });

    return this.challenges.filter(c => 
      c.gameId === gameId && 
      c.receiverId === userId && 
      c.status === 'pending'
    );
  }

  async respondToChallenge(challengeId: string, response: 'accept' | 'reject'): Promise<Challenge> {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (!challenge) throw new Error('Challenge not found');

    challenge.status = response === 'accept' ? 'accepted' : 'rejected';
    challenge.respondedAt = new Date().toISOString();

    if (response === 'reject') {
        this.applyPenalty(challenge);
    }

    return challenge;
  }

  private applyPenalty(challenge: Challenge) {
      // Simulate Penalty Logic
      // Penalty A: Lose a random card
      // Penalty B: Sender gets bonus
      const isPenaltyA = Math.random() > 0.5;
      
      this.penalties.push({
          id: 'pen_' + Date.now(),
          gameId: challenge.gameId,
          targetUserId: challenge.receiverId,
          type: isPenaltyA ? 'lose_card' : 'partner_bonus',
          description: isPenaltyA ? 'You lost a random card!' : 'Partner got a bonus card!',
          appliedAt: new Date().toISOString()
      });

      // Execute penalty logic (remove card from deck etc) - TODO for detailed implementation
  }
  async getGameEvents(gameId: string): Promise<(Challenge | Penalty)[]> {
      const gameChallenges = this.challenges.filter(c => c.gameId === gameId);
      const gamePenalties = this.penalties.filter(p => p.gameId === gameId);
      
      const events = [...gameChallenges, ...gamePenalties];
      // Sort by date descending
      return events.sort((a, b) => {
          const dateA = 'sentAt' in a ? a.sentAt : a.appliedAt;
          const dateB = 'sentAt' in b ? b.sentAt : b.appliedAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }
}

export const GameService = new MockGameService();
