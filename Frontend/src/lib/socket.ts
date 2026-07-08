import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

export function connectSocket(accessToken: string): Socket {
  if (socket) socket.disconnect();
  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    withCredentials: true,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
