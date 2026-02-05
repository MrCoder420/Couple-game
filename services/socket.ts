import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = Platform.OS === 'web'
    ? 'http://localhost:3000'
    : 'http://10.132.48.193:3000';

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
}

export default new SocketService();
