import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = Platform.OS === 'web'
    ? 'http://13.53.129.22'
    : 'http://13.53.129.22';

class SocketService {
    public socket: Socket | null = null;
    private authenticated: boolean = false;

    connect(token: string, roomId: string) {
        if (this.socket && this.socket.connected) {
            return;
        }

        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('Connected to socket server:', this.socket?.id);

            // Authenticate immediately after connection
            this.socket?.emit('authenticate', { token, roomId });
            this.authenticated = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
            this.authenticated = false;
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.authenticated = false;
        }
    }

    // Listen for partner online/offline
    onPartnerStatus(callback: (data: { userId: string; status: string }) => void) {
        this.socket?.on('partner_online', callback);
    }

    // Listen for player joined (room updates)
    onPlayerJoined(callback: (data: { playerCount: number }) => void) {
        this.socket?.on('player_joined', callback);
    }

    // Listen for game ready (both players present)
    onGameReady(callback: () => void) {
        this.socket?.on('game_ready', callback);
    }

    // Listen for incoming challenges
    onChallengeReceived(callback: (challenge: any) => void) {
        this.socket?.on('challenge_received', callback);
    }

    // Listen for challenge outcomes
    onChallengeOutcome(callback: (outcome: any) => void) {
        this.socket?.on('challenge_outcome', callback);
    }

    // Emit challenge sent (notify server to broadcast)
    notifyChallengeSent(roomId: string, challengeId: string) {
        if (!this.authenticated) {
            console.warn('Socket not authenticated');
            return;
        }
        this.socket?.emit('challenge_sent', { roomId, challengeId });
    }

    // Emit challenge responded
    notifyChallengeResponded(roomId: string, challengeId: string) {
        if (!this.authenticated) {
            console.warn('Socket not authenticated');
            return;
        }
        this.socket?.emit('challenge_responded', { roomId, challengeId });
    }

    // Send card to partner
    sendCard(card: any) {
        if (!this.authenticated) {
            console.warn('Socket not authenticated');
            return;
        }
        this.socket?.emit('send_card', card);
    }

    // Listen for incoming cards
    onCardReceived(callback: (card: any) => void) {
        this.socket?.on('receive_card', callback);
    }

    // Register push token
    registerPushToken(token: string) {
        if (!this.authenticated) {
            // If not authenticated yet, we can't associate token with user easily
            // But we can emit it and server can handle if it knows socket.id
            // Better to wait for auth, but for now:
            console.log('Registering push token:', token);
            this.socket?.emit('register_push_token', { token });
        } else {
            this.socket?.emit('register_push_token', { token });
        }
    }
}

export default new SocketService();
