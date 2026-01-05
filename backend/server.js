/**
 * Sakina Backend Server
 * Main entry point for the API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const adminRoutes = require('./routes/admin');
const specialistRoutes = require('./routes/specialist');
const courseRoutes = require('./routes/courses');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow all origins for development
app.use(express.json({ limit: '10mb' })); // For avatar uploads
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/specialist', specialistRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/messages', messageRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Sakina API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error', details: err.toString() });
});

// Socket.io Setup
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for mobile/local network testing
        methods: ["GET", "POST"]
    }
});

// Room user tracking
const roomUsers = new Map(); // roomId -> Set<userId>

// Socket.io Events
io.on('connection', (socket) => {
    console.log('🔌 New Client Connected:', socket.id);

    socket.on('join-room', (data) => {
        // Support both old format (string) and new format (object with user info)
        const roomId = typeof data === 'string' ? data : data.roomId;
        const userInfo = typeof data === 'object' ? {
            socketId: socket.id,
            name: data.name || 'مستخدم',
            avatar: data.avatar || null,
            agoraUid: data.agoraUid || null
        } : { socketId: socket.id, name: 'مستخدم', avatar: null, agoraUid: null };

        socket.join(roomId);
        console.log(`👤 User ${userInfo.name} (${socket.id}) joined room: ${roomId}`);

        // Track users with their info
        if (!roomUsers.has(roomId)) {
            roomUsers.set(roomId, new Map());
        }
        roomUsers.get(roomId).set(socket.id, userInfo);

        // Broadcast user list with full info
        const usersList = Array.from(roomUsers.get(roomId).values());
        io.to(roomId).emit('room-users-update', usersList);
    });

    socket.on('moderation-action', (data) => {
        // data = { action: 'mute', targetUid: '123', channelName: 'abc' }
        const { channelName, action, targetUid } = data;
        console.log(`🛡️ Moderation [${action}] on ${targetUid} in ${channelName}`);

        // Broadcast to everyone in the room (including sender to confirm)
        io.to(channelName).emit('moderation-event', data);
    });

    // Chat messaging
    socket.on('chat-message', (data) => {
        // data = { roomId, message, sender: { name, avatar, agoraUid } }
        const { roomId, message, sender } = data;
        const timestamp = new Date().toISOString();

        console.log(`💬 [${roomId}] ${sender.name}: ${message}`);

        // Broadcast to everyone in the room
        io.to(roomId).emit('chat-message', {
            id: `${socket.id}-${Date.now()}`,
            message,
            sender,
            timestamp
        });
    });

    socket.on('disconnecting', () => {
        // Remove user from all their rooms
        for (const room of socket.rooms) {
            if (roomUsers.has(room)) {
                roomUsers.get(room).delete(socket.id);
                // Broadcast update with full user info
                const usersList = Array.from(roomUsers.get(room).values());
                io.to(room).emit('room-users-update', usersList);

                // Cleanup empty rooms
                if (roomUsers.get(room).size === 0) {
                    roomUsers.delete(room);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Client Disconnected:', socket.id);
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`🚀 Sakina Backend running on http://localhost:${PORT}`);
    console.log(`gw API Health: http://localhost:${PORT}/api/health`);
    console.log(`🔌 Socket.io ready`);
});
