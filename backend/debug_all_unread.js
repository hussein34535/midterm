
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function checkAllUnread() {
    console.log('Checking ALL unread messages for Owner/System/Legacy...');

    const ownerId = '9ba9b332-4743-4b0d-91f1-3a93482aeae0';
    const legacyId = 'b1cb10e6-002e-4377-850e-2c3bcbdfb648';

    // Fetch System User ID
    const { data: systemUser } = await supabase.from('users').select('id').eq('email', 'system@iwaa.com').single();
    const systemId = systemUser?.id;

    console.log('IDs:', { ownerId, systemId, legacyId });

    const targetIds = [ownerId, legacyId];
    if (systemId) targetIds.push(systemId);

    // Fetch unread messages where receiver is one of these
    const { data: messages, error } = await supabase
        .from('messages')
        .select(`
            id, content, sender_id, receiver_id, read, created_at,
            sender:sender_id(nickname, email)
        `)
        .in('receiver_id', targetIds)
        .eq('read', false);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`\nFound ${messages.length} TOTAL unread messages.`);

    if (messages.length > 0) {
        console.table(messages.map(m => ({
            id: m.id,
            sender: m.sender?.nickname,
            receiver_id: m.receiver_id === ownerId ? 'OWNER' : (m.receiver_id === systemId ? 'SYSTEM' : 'LEGACY'),
            content: m.content.substring(0, 20),
            created_at: m.created_at
        })));
    }

    // Also check "sent by me" that are unread? (Should not count, but valid to check)
    // Sometimes logic flips.
}

checkAllUnread();
