import { io, Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    const token = localStorage.getItem("accessToken");

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("❌ WebSocket disconnected");
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const wsService = new WebSocketService();
