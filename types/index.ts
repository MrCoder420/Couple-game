export type CardType = 'action' | 'question' | 'skip' | 'swap' | 'reverse' | 'shield' | 'reveal';

export interface Card {
  id: string;
  type: CardType;
  content: string; // The dae/question text
  isFixed: boolean; // true for the 5 special cards
}

export interface PlayerDeck {
  userId: string;
  cards: Card[]; // The 30 cards
  usedCardIds: string[]; // IDs of cards already consumed
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currentGameId?: string;
  partnerId?: string;
}

export type GameDuration = 7 | 15 | 30;

export interface Game {
  id: string;
  code: string;
  player1Id: string;
  player2Id?: string;
  startDate: string; // ISO date
  duration: GameDuration;
  status: 'waiting_for_partner' | 'active' | 'completed';
}

export type ChallengeStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Challenge {
  id: string;
  gameId: string;
  senderId: string;
  receiverId: string;
  cardId: string;
  cardContent: string;
  status: ChallengeStatus;
  sentAt: string; // ISO date
  respondedAt?: string; // ISO date
}

export interface Penalty {
  id: string;
  gameId: string;
  targetUserId: string; // Who suffers the penalty
  type: 'lose_card' | 'partner_bonus';
  description: string;
  appliedAt: string;
}
