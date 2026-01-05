/**
 * Agora Token Generation Routes
 * Generates RTC tokens for voice/video calls
 */

const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Agora credentials from environment
const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

/**
 * GET /api/agora/token
 * Generate RTC token for a channel
 * Query params: channelName, uid (optional)
 */
router.get('/token', authMiddleware, async (req, res) => {
    try {
        const { channelName, uid } = req.query;

        if (!channelName) {
            return res.status(400).json({ error: 'channelName is required' });
        }

        if (!APP_ID || !APP_CERTIFICATE) {
            console.error('Agora credentials not configured');
            return res.status(500).json({ error: 'Agora not configured on server' });
        }

        // Use provided uid or generate one
        const uidNum = uid ? parseInt(uid) : 0;

        // Token expires in 24 hours (in seconds)
        const expirationTimeInSeconds = 86400;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        // Build token with publisher role
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uidNum,
            RtcRole.PUBLISHER,
            privilegeExpiredTs
        );

        console.log(`Generated Agora token for channel: ${channelName}, uid: ${uidNum}`);

        res.json({
            token,
            appId: APP_ID,
            channel: channelName,
            uid: uidNum,
            expiresAt: new Date(privilegeExpiredTs * 1000).toISOString()
        });

    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

module.exports = router;
