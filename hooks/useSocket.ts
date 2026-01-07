import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useSocket = (userId?: string) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!userId) return;

        // Initialize socket
        socketRef.current = io(API_URL, {
            transports: ['websocket'], // Force websocket for performance
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('🔌 Socket Connected:', socket.id);

            // Join user-specific room for private notifications
            socket.emit('join-room', `user_${userId}`);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err);
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [userId]);

    return socketRef;
};
