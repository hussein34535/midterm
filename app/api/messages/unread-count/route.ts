import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = decoded.id;
        const userRole = decoded.role;

        // Build receiver IDs list
        let receiverIds = [userId];

        if (userRole === 'owner') {
            // Get System user ID
            const { data: systemUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', 'system@iwaa.com')
                .single();

            if (systemUser) receiverIds.push(systemUser.id);
            receiverIds.push('b1cb10e6-002e-4377-850e-2c3bcbdfb648'); // Legacy ID
        }

        // Count unread messages
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('receiver_id', receiverIds)
            .eq('read', false);

        return NextResponse.json({ unreadCount: count || 0 });
    } catch (error) {
        console.error('Unread count error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
