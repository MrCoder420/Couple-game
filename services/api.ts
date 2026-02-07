import axios from 'axios';

const API_URL = 'http://13.53.129.22/api';
// const API_URL = Platform.OS === 'web'
//     ? 'http://127.0.0.1:3000/api'
//     : 'http://10.94.159.181:3000/api';

class ApiService {
    private token: string | null = null;

    setToken(token: string) {
        this.token = token;
    }

    getToken() {
        return this.token;
    }

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
    }

    // Auth
    async login(email: string) {
        const response = await axios.post(`${API_URL}/auth/login`, { email });
        this.setToken(response.data.token);
        return response.data;
    }

    async getMe() {
        const response = await axios.get(`${API_URL}/users/me`, {
            headers: this.getHeaders()
        });
        return response.data;
    }

    // Rooms
    async createRoom(durationDays: number = 7) {
        const response = await axios.post(`${API_URL}/rooms`,
            { duration_days: durationDays },
            { headers: this.getHeaders() }
        );
        return response.data;
    }

    async joinRoom(code: string) {
        const response = await axios.post(`${API_URL}/rooms/join`,
            { code },
            { headers: this.getHeaders() }
        );
        return response.data;
    }

    async getRoom(roomId: string) {
        const response = await axios.get(`${API_URL}/rooms/${roomId}`, {
            headers: this.getHeaders()
        });
        return response.data;
    }

    async getRoomHistory(roomId: string) {
        const response = await axios.get(`${API_URL}/rooms/${roomId}/history`, {
            headers: this.getHeaders()
        });
        return response.data;
    }

    // Challenges
    async sendChallenge(roomId: string, cardId: string, cardContent: string) {
        const response = await axios.post(`${API_URL}/challenges`,
            { roomId, cardId, cardContent },
            { headers: this.getHeaders() }
        );
        return response.data;
    }

    async respondToChallenge(challengeId: string, response: 'accept' | 'reject') {
        const res = await axios.put(`${API_URL}/challenges/${challengeId}/respond`,
            { response },
            { headers: this.getHeaders() }
        );
        return res.data;
    }

    async getPendingChallenges(roomId?: string) {
        const url = roomId
            ? `${API_URL}/challenges/pending?roomId=${roomId}`
            : `${API_URL}/challenges/pending`;

        const response = await axios.get(url, {
            headers: this.getHeaders()
        });
        return response.data;
    }
}

export default new ApiService();
