import React, { createContext, useContext, useState } from 'react';
import { GameService } from '../services/GameService';
import { Card, Challenge, Game, Penalty, PlayerDeck } from '../types';
import { useAuth } from './AuthContext';

interface GameContextType {
  game: Game | null;
  deck: PlayerDeck | null;
  pendingChallenges: Challenge[];
  isLoading: boolean;
  createGame: (duration: 7 | 15 | 30) => Promise<string>; // returns code
  joinGame: (code: string) => Promise<void>;
  checkChallenges: () => Promise<void>;
  sendCard: (card: Card) => Promise<void>;
  respondToChallenge: (challengeId: string, response: 'accept' | 'reject') => Promise<void>;
  events: (Challenge | Penalty)[];
  loadGame: (gameId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [deck, setDeck] = useState<PlayerDeck | null>(null);
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);
  const [events, setEvents] = useState<(Challenge | Penalty)[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Poll for updates (Simulation of real-time)
  // In a real app, use WebSockets or Supabase Realtime
  // Here we just manual refresh or poll

  const refreshGameDataInternal = async (targetGame: Game) => {
    if (!user) return;
    try {
      const history = await GameService.getGameEvents(targetGame.id);
      setEvents(history);

      const challenges = await GameService.getPendingChallenges(targetGame.id, user.id);
      setPendingChallenges(challenges);

      // Also refresh deck if needed
      const myDeck = await GameService.getPlayerDeck(targetGame.id, user.id);
      setDeck(myDeck);
    } catch (e) {
      console.error("Sync error", e);
    }
  };

  const refreshGameData = async () => {
    if (game) await refreshGameDataInternal(game);
  };

  const loadGame = async (gameId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Just construct a dummy game object so we can use the ID
      // The service layer handles fetching real data via ID
      const dummyGame: Game = {
        id: gameId,
        code: 'LOADING',
        player1Id: user.id,
        startDate: new Date().toISOString(),
        duration: 7, // default
        status: 'active'
      };
      // Ideally we should fetch the REAL game object here via GameService.getGamestate(gameId)
      // But for MVP history fix, the ID is what matters.
      setGame(dummyGame);

      await refreshGameDataInternal(dummyGame);
    } finally {
      setIsLoading(false);
    }
  };

  const createGame = async (duration: 7 | 15 | 30) => {
    if (!user) return '';
    setIsLoading(true);
    try {
      const newGame = await GameService.createGame(user.id, duration);
      setGame(newGame);
      return newGame.code;
    } finally {
      setIsLoading(false);
    }
  };

  const joinGame = async (code: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const joinedGame = await GameService.joinGame(user.id, code);
      setGame(joinedGame);
      await refreshGameDataInternal(joinedGame);
    } finally {
      setIsLoading(false);
    }
  };

  const sendCard = async (card: Card) => {
    if (!game || !user || !game.player2Id) return;
    // In a real app we'd know partner ID more robustly. 
    // Simplified: if I am player1, partner is player2.
    const partnerId = user.id === game.player1Id ? game.player2Id : game.player1Id;
    if (!partnerId) return;

    await GameService.sendChallenge(game.id, user.id, partnerId, card);
    await refreshGameData(); // refresh deck status
  };

  const respondToChallenge = async (challengeId: string, response: 'accept' | 'reject') => {
    await GameService.respondToChallenge(challengeId, response);
    await refreshGameData();
  };

  return (
    <GameContext.Provider value={{
      game,
      deck,
      pendingChallenges,
      isLoading,
      createGame,
      joinGame,
      checkChallenges: refreshGameData,
      loadGame,
      sendCard,
      respondToChallenge,
      events
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
