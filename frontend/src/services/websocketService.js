import { getPostureWsBaseUrl } from './apiConfig';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.onMessageCallback = null;
    this.onStatusChange = null;
    this.lastUrl = null;
  }

  connect(userId, exercise = 'general', onMessage, onStatusChange) {
    const wsUrl = `${getPostureWsBaseUrl()}/ws/analyze?userId=${encodeURIComponent(userId)}&exercise=${encodeURIComponent(exercise)}`;
    this.onMessageCallback = onMessage;
    this.onStatusChange = onStatusChange;
    this.lastUrl = wsUrl;

    this.disconnect();

    this.socket = new WebSocket(wsUrl);
    this.onStatusChange?.('connecting');

    this.socket.onopen = () => {
      this.onStatusChange?.('connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessageCallback?.(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      this.onStatusChange?.('error');
    };

    this.socket.onclose = () => {
      this.onStatusChange?.('disconnected');
    };
  }

  sendFrame(base64Frame) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(base64Frame);
      return true;
    }

    return false;
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default new WebSocketService();
