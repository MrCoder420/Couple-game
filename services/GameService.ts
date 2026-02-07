import { Card, Challenge, Game, GameDuration, Penalty, PlayerDeck } from '../types';
import apiService from './api';
import socketService from './socket';

// Mock Data Pools (kept for reference or fallback if needed)
const ACTION_CARDS = [
  "Cook a special dinner tonight.",
  "Give a 10-minute massage.",
  "Write a love letter.",
  "Plan a surprise date.",
  "No phones for 2 hours tonight.",
  "Slow dance to our favorite song.",
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
        (err: any) => reject(new Error(err))
      );
    });
  }

  async getGamestate(gameId: string): Promise<Game | undefined> {
    // In real app, fetch from server.
    return this.games.find(g => g.id === gameId);
  }

  // --- Card Logic ---

  async getPlayerDeck(gameId: string, userId: string): Promise<PlayerDeck> {
    return this.decks[`${gameId}_${userId}`];
  }

  // --- Challenge Logic ---

  async sendChallenge(gameId: string, senderId: string, receiverId: string, card: Card): Promise<Challenge> {
    console.log('[GameService] sendChallenge called', { gameId, cardId: card.id });

    // Find room code to emit via socket
    const roomCode = this.games.find(g => g.id === gameId)?.code;

    // In real implementation we might fetch relevant room info from API if not local
    // Assuming for MVP the connected socket room is what matters or we have code.

    if (roomCode) {
      // Corrected: sendCard takes only card, or (roomCode, card) depending on implementation?
      // Checked socket.ts: sendCard(card: any) { ... }
      // Wait, previous file view showed: sendCard(card: Card) inside class...
      // Let's check view of socket.ts if possible or assume simple emit.
      // Based on api-server.js it listens for 'send_card'.
      // And socket.ts likely emits 'send_card'.
      // Let's assume socketService.sendCard(card) is correct signature from a previous context check 
      // OR socketService.sendCard(roomCode, card) if updated.
      // Let's use the one that matches typical pattern. 
      // Actually, socket.ts usually just emits event. 
      // If socketService.sendCard takes 1 arg, pass card.
      // We'll trust the previous error "Expected 1 arguments, but got 2" which implies it takes 1.

      socketService.sendCard(card); // Corrected based on lint error "Expected 1 arguments, but got 2."
    } else {
      // If we don't have code locally, maybe just emit card? socketService handles state?
      socketService.sendCard(card);
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
    try {
      const response = await apiService.getPendingChallenges(gameId);
      return (response.challenges || []).map((c: any) => ({
        ...c,
        senderId: c.sender_id,
        receiverId: c.receiver_id,
        cardId: c.card_id, // CRITICAL FIX: Map card_id to cardId
        sentAt: c.sent_at,
        cardContent: c.card_content,
        gameId
      }));
    } catch (error) {
      console.error('Failed to get pending challenges:', error);
      return [];
    }
  }

  async respondToChallenge(challengeId: string, response: 'accept' | 'reject'): Promise<Challenge> {
    const game = this.games[0]; // Simplification
    if (game) {
      // Use apiService for response, socket is for notification
      await apiService.respondToChallenge(challengeId, response);
      // Notify partner via socket
      socketService.notifyChallengeResponded(game.code, challengeId);
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
    }
  }

  // Called when we receive challenge_received from server
  handleIncomingChallenge(challenge: Challenge) {
    console.log('[GameService] handleIncomingChallenge', challenge);
    if (!this.challenges.find(c => c.id === challenge.id)) {
      const newChallenge = {
        ...challenge,
        gameId: this.games[0]?.id // Map back to local game ID context
      };
      this.challenges.push(newChallenge);
      console.log('[GameService] Challenge pushed to local state. Total:', this.challenges.length);
    }
  }

  async getGameEvents(gameId: string): Promise<(Challenge | Penalty)[]> {
    try {
      // Fetch real history from API
      const response = await apiService.getRoomHistory(gameId);

      const challenges = (response.challenges || []).map((c: any) => ({
        ...c,
        senderId: c.sender_id,
        receiverId: c.receiver_id,
        cardId: c.card_id, // CRITICAL FIX: Map card_id to cardId
        sentAt: c.sent_at,
        cardContent: c.card_content,
        gameId // maintain context
      }));

      const penalties = (response.events || [])
        .filter((e: any) => e.event_type === 'penalty_applied') // Only include real penalties
        .map((p: any) => ({
          ...p,
          appliedAt: p.created_at,
          gameId
        }));

      return [...challenges, ...penalties].sort((a, b) => {
        const dateA = 'sentAt' in a ? a.sentAt : a.appliedAt;
        const dateB = 'sentAt' in b ? b.sentAt : b.appliedAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    } catch (error) {
      console.error('Failed to fetch game events:', error);
      return [];
    }
  }
}

export const GameService = new MockGameService();
