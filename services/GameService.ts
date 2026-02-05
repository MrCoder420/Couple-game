import { Card, Challenge, Game, GameDuration, Penalty, PlayerDeck } from '../types';
import socketService from './socket';

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
    return new Promise((resolve) => {
      // @ts-ignore
      socketService.createRoom((code: string, serverDeck: any) => {
        const newGame: Game = {
          id: 'game_' + Date.now(),
          code,
          player1Id: hostUserId,
          startDate: new Date().toISOString(),
          duration,
          status: 'waiting_for_partner',
        };
        this.games.push(newGame);

        // Store server provided deck
        if (serverDeck) {
          this.decks[`${newGame.id}_${hostUserId}`] = serverDeck;
        }

        // Listen for ready event
        socketService.socket?.on('game_ready', () => {
          console.log('PARTNER JOINED! GAME READY');
          newGame.status = 'active';
        });

        // Listen for Gameplay Events
        socketService.socket?.on('challenge_received', (challenge: any) => {
          this.handleIncomingChallenge(challenge);
        });

        socketService.socket?.on('challenge_outcome', (event: any) => {
          this.handleChallengeOutcome(event);
        });

        resolve(newGame);
      });
    });
  }

  async joinGame(userId: string, code: string): Promise<Game> {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      socketService.joinRoom(code,
        (serverDeck: any) => {
          // Success
          const game: Game = {
            id: 'game_' + Date.now(), // Placeholder
            code,
            player1Id: 'partner',
            player2Id: userId,
            startDate: new Date().toISOString(),
            duration: 7, // Default or fetch from server
            status: 'active',
          };
          this.games.push(game); // Ensure it exists locally

          // Store server provided deck
          if (serverDeck) {
            this.decks[`${game.id}_${userId}`] = serverDeck;
          }

          // Listen for Gameplay Events (Joiner needs them too)
          socketService.socket?.on('challenge_received', (challenge: any) => {
            this.handleIncomingChallenge(challenge);
          });

          socketService.socket?.on('challenge_outcome', (event: any) => {
            this.handleChallengeOutcome(event);
          });

          resolve(game);
        },
        (err) => reject(new Error(err))
      );
    });
  }

  async getGamestate(gameId: string): Promise<Game | undefined> {
    // In real app, fetch from server.
    return this.games.find(g => g.id === gameId);
  }

  // --- Card Logic ---

  // No longer needed locally, but keeping empty stub if TS requires, or better remove usage
  private generateDeck(gameId: string, userId: string) {
    // Deprecated: Deck comes from server now
  }

  async getPlayerDeck(gameId: string, userId: string): Promise<PlayerDeck> {
    return this.decks[`${gameId}_${userId}`];
  }

  // --- Challenge Logic ---


  // --- Challenge Logic ---

  async sendChallenge(gameId: string, senderId: string, receiverId: string, card: Card): Promise<Challenge> {
    console.log('[GameService] sendChallenge called', { gameId, cardId: card.id });
    // Optimistic UI update or wait?
    // Let's create a pending placeholder but real logic is on server
    const roomCode = this.games.find(g => g.id === gameId)?.code;
    if (roomCode) {
      console.log('[GameService] Emitting via socket to room:', roomCode);
      socketService.sendChallenge(roomCode, card);
    } else {
      console.error('[GameService] No room code found for game', gameId);
    }

    // Return a temporary placeholder to satisfy type, event listener will handle real state
    return {
      id: 'temp_' + Date.now(),
      gameId,
      senderId,
      receiverId,
      cardId: card.id,
      cardContent: card.content,
      status: 'pending',
      sentAt: new Date().toISOString()
    };
  }

  async getPendingChallenges(gameId: string, userId: string): Promise<Challenge[]> {
    // Now purely relies on local state sync from socket events
    return this.challenges.filter(c =>
      c.gameId === gameId &&
      c.receiverId === userId &&
      c.status === 'pending'
    );
  }

  async respondToChallenge(challengeId: string, response: 'accept' | 'reject'): Promise<Challenge> {
    // Find game code
    // We need gameCode to respond. 
    // Assumption: single active game for MVP
    const game = this.games[0]; // Simplification
    if (game) {
      socketService.respondToChallenge(game.code, challengeId, response);
    }

    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge) {
      challenge.status = response === 'accept' ? 'accepted' : 'rejected';
    }
    return challenge as Challenge;
  }

  // Called when we receive challenge_outcome from server
  handleChallengeOutcome(event: any) {
    const { challengeId, response, penalty } = event;
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge) {
      challenge.status = response === 'accept' ? 'accepted' : 'rejected';
      challenge.respondedAt = new Date().toISOString();
    }

    if (penalty) {
      this.penalties.push({
        id: 'pen_' + Date.now(),
        gameId: challenge?.gameId || 'unknown',
        targetUserId: penalty.targetId,
        type: penalty.type,
        description: penalty.description,
        appliedAt: new Date().toISOString()
      });

      // Apply side effects (remove card etc)
      if (penalty.type === 'lose_card') {
        // Find deck for target and remove a random unused card
        // For MVP we just show the message, real deck sync might need refresh
      }
    }
  }

  // Called when we receive challenge_received from server
  handleIncomingChallenge(challenge: Challenge) {
    console.log('[GameService] handleIncomingChallenge', challenge);
    // Ensure we don't duplicate
    if (!this.challenges.find(c => c.id === challenge.id)) {
      // Map backend simplified object to full frontend Challenge type if needed
      // Assuming backend sends compatible structure
      const newChallenge = {
        ...challenge,
        gameId: this.games[0]?.id // Map back to local game ID context
      };
      this.challenges.push(newChallenge);
      console.log('[GameService] Challenge pushed to local state. Total:', this.challenges.length);
    }
  }

  private applyPenalty(challenge: Challenge) {
    // Deprecated: Server handles this
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
