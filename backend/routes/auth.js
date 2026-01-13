/**
 * Authentication Routes
 * Handles user registration and login with Supabase
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user + Create support chat
 */
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

/**
 * POST /api/auth/register
 * Register a new user + Create support chat + Send Verification Email
 */
/**
 * POST /api/auth/register
 * Register a new user + Create support chat + Send Verification Email
 */
router.post('/register', async (req, res) => {
    try {
        const { nickname, email, password, avatar } = req.body;

        // Validation
        if (!nickname || !email || !password) {
            return res.status(400).json({
                error: 'جميع الحقول مطلوبة (الاسم، البريد، كلمة المرور)'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
            });
        }

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({
                error: 'هذا البريد الإلكتروني مسجل بالفعل'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit OTP
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Create user in Supabase
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                id: uuidv4(),
                nickname,
                email,
                password: hashedPassword,
                avatar: avatar || null,
                created_at: new Date().toISOString(),
                is_verified: false, // Require verification
                verification_token: verificationToken // Save OTP token
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === '42703') {
                return res.status(500).json({
                    error: 'خطأ في قاعدة البيانات: الأعمدة غير موجودة. يرجى مراجعة المسؤول.'
                });
            }
            return res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب' });
        }

        // Send Verification Email with OTP
        const emailHtml = `
            <div style="text-align: right; direction: rtl; font-family: Arial, sans-serif;">
                <h2>مرحباً ${nickname}! 👋</h2>
                <p>شكراً لتسجيلك في منصة إيواء. لتفعيل حسابك، يرجى استخدام الرمز التالي:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="background-color: #f3f4f6; color: #1f2937; padding: 15px 30px; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 10px; border: 2px dashed #E85C3F;">
                        ${verificationToken}
                    </span>
                </div>
                <p>نتمنى لك رحلة تعافي موفقة معنا.</p>
            </div>
        `;
        console.log('📤 [AUTH] Calling sendEmail for registration verification...');
        console.log(`   Email: ${email}, Token: ${verificationToken}`);
        await sendEmail(email, 'رمز تفعيل حسابك في إيواء', emailHtml);
        console.log('📤 [AUTH] sendEmail call completed.');

        // ... (Guest & Welcome Message logic remains) ...


        // Send Welcome Message from System
        try {
            const { data: systemUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', 'system@iwaa.com')
                .single();

            if (systemUser) {
                const welcomeMessage = "مرحباً بك في منصة إيواء! 🌟\nنحن هنا لدعمك ومساعدتك. يمكنك بدء محادثة مع الأخصائيين أو الانضمام للمجموعات الداعمة.\nلا تتردد في طرح أي سؤال.";

                await supabase.from('messages').insert({
                    id: uuidv4(),
                    sender_id: systemUser.id,
                    receiver_id: newUser.id,
                    content: welcomeMessage,
                    type: 'text',
                    created_at: new Date().toISOString(),
                    read: false
                });
            }
        } catch (msgError) {
            console.error('Welcome message error:', msgError);
            // Don't fail registration if welcome message fails
        }

        // NO Auto-Login - Require email verification first
        const { password: _, ...userWithoutPassword } = newUser;

        // 🔔 Notify owners about new registration
        try {
            const { data: allOwners } = await supabase
                .from('users')
                .select('id, email, nickname')
                .eq('role', 'owner');

            if (allOwners && allOwners.length > 0) {
                const notifyHtml = `
                    <div style="text-align: right; direction: rtl; font-family: Arial, sans-serif;">
                        <h2>تسجيل جديد 🎉</h2>
                        <p><strong>الاسم:</strong> ${nickname}</p>
                        <p><strong>البريد:</strong> ${email}</p>
                        <p><strong>الوقت:</strong> ${new Date().toLocaleString('ar-EG')}</p>
                    </div>
                `;
                for (const owner of allOwners) {
                    if (owner.email && !owner.email.includes('@iwaa.guest')) {
                        sendEmail(owner.email, `تسجيل جديد: ${nickname}`, notifyHtml).catch(e => console.error('Owner notify error:', e));
                    }
                }
                console.log('📧 Owner notification sent for new registration:', email);
            }
        } catch (notifyError) {
            console.error('Owner registration notify error:', notifyError);
        }

        res.status(201).json({
            message: 'تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.',
            requiresVerification: true,
            email: email
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء التسجيل' });
    }
});

/**
 * POST /api/auth/verify-email
 * Verify user email with token
 */
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'رمز التفعيل مطلوب' });
        }

        // Find user with this token
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, is_verified')
            .eq('verification_token', token)
            .single();

        if (error || !user) {
            return res.status(400).json({ error: 'رمز التفعيل غير صالح أو منتهي الصلاحية' });
        }

        if (user.is_verified) {
            return res.json({ message: 'الحساب مفعل بالفعل' });
        }

        // Activate User
        const { error: updateError } = await supabase
            .from('users')
            .update({
                is_verified: true,
                verification_token: null
            })
            .eq('id', user.id);

        if (updateError) {
            return res.status(500).json({ error: 'حدث خطأ أثناء التفعيل' });
        }

        // Generate JWT for Auto-Login
        const sessionToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role || 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        );

        // Fetch full user data to return
        const { data: fullUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        const { password: _, ...userWithoutPassword } = fullUser;

        // 📧 Send welcome email after verification
        try {
            const welcomeHtml = `
                <div style="text-align: right; direction: rtl; font-family: Arial, sans-serif;">
                    <h2>مرحباً بك في إيواء! 🎉</h2>
                    <p>مرحباً <strong>${fullUser.nickname || 'عزيزي/عزيزتي'}</strong>،</p>
                    <p>تم تفعيل حسابك بنجاح! يمكنك الآن:</p>
                    <ul style="line-height: 2;">
                        <li>الانضمام للكورسات والجلسات</li>
                        <li>التواصل مع الأخصائيين</li>
                        <li>المشاركة في مجموعات الدعم</li>
                    </ul>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: #E85C3F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">
                        ابدأ رحلتك الآن
                    </a>
                    <p style="margin-top: 30px; color: #666;">نتمنى لك رحلة تعافي موفقة 💚</p>
                </div>
            `;
            sendEmail(user.email, 'مرحباً بك في إيواء - تم تفعيل حسابك', welcomeHtml)
                .then(() => console.log('📧 Welcome email sent to:', user.email))
                .catch(e => console.error('Welcome email error:', e));
        } catch (emailErr) {
            console.error('Welcome email exception:', emailErr);
        }

        res.json({
            message: 'تم تفعيل الحساب بنجاح! جاري تحويلك...',
            token: sessionToken,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء التفعيل' });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }

        // Verify Password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }

        // Check Verification STATUS
        // Note: For existing users without 'is_verified' column (if added later), 
        // we might handle null as true OR false. 
        // If the column exists, it should be true. 
        // For Backward Compability during dev: if is_verified is NOT FALSE (i.e. true or null/undefined if schema strictly enforces default false), pass.
        // Assuming default FALSE for new users. Old users might be NULL. 
        // Let's enforce check if column exists. 

        // Check Verification STATUS - ENABLED
        if (user.is_verified === false) {
            return res.status(403).json({
                error: 'يرجى تأكيد بريدك الإلكتروني أولاً.',
                notVerified: true,
                email: user.email
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        );

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'تم تسجيل الدخول بنجاح',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
    }
});

/**
 * POST /api/auth/verify
 * ... keep existing ...
 */
router.post('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'التوكن غير موجود' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { data: user, error } = await supabase
            .from('users')
            .select('id, nickname, email, avatar, created_at, role')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'المستخدم غير موجود' });
        }

        res.json({ user });

    } catch (error) {
        res.status(401).json({ error: 'التوكن غير صالح' });
    }
});

/**
 * POST /api/auth/resend-otp
 * Resend verification code (max 5 times per email)
 */
const otpAttempts = new Map(); // Track OTP attempts per email

router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
        }

        // Rate limiting - max 5 attempts per email per hour
        const now = Date.now();
        const userAttempts = otpAttempts.get(email) || { count: 0, firstAttempt: now };

        // Reset after 1 hour
        if (now - userAttempts.firstAttempt > 60 * 60 * 1000) {
            userAttempts.count = 0;
            userAttempts.firstAttempt = now;
        }

        if (userAttempts.count >= 5) {
            const remainingMinutes = Math.ceil((60 * 60 * 1000 - (now - userAttempts.firstAttempt)) / 60000);
            return res.status(429).json({
                error: `تم تجاوز الحد الأقصى (5 محاولات). حاول مرة أخرى بعد ${remainingMinutes} دقيقة.`,
                remainingMinutes
            });
        }

        userAttempts.count++;
        otpAttempts.set(email, userAttempts);

        // Find user
        const { data: user, error } = await supabase
            .from('users')
            .select('id, nickname, is_verified')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        if (user.is_verified) {
            return res.json({ message: 'الحساب مفعل بالفعل' });
        }

        // Generate New OTP
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Update User
        const { error: updateError } = await supabase
            .from('users')
            .update({ verification_token: verificationToken })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        // Send Email
        const emailHtml = `
            <div style="text-align: right; direction: rtl; font-family: Arial, sans-serif;">
                <h2>مرحباً ${user.nickname}! 👋</h2>
                <p>لقد طلبت رمز تفعيل جديد. رمزك هو:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="background-color: #f3f4f6; color: #1f2937; padding: 15px 30px; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 10px; border: 2px dashed #E85C3F;">
                        ${verificationToken}
                    </span>
                </div>
                <p>تجاهل هذه الرسالة إذا لم تطلب الرمز.</p>
            </div>
        `;

        await sendEmail(email, 'رمز تفعيل جديد', emailHtml);

        res.json({ message: 'تم إرسال رمز جديد بنجاح' });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'فشل إرسال الرمز' });
    }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset link
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
        }

        // Find user
        const { data: user, error } = await supabase
            .from('users')
            .select('id, nickname')
            .eq('email', email)
            .single();

        if (error || !user) {
            // Security: Don't reveal if user exists. Delay response slightly.
            await new Promise(resolve => setTimeout(resolve, 1000));
            return res.json({ message: 'تم إرسال رابط إعادة التعيين إذا كان البريد مسجلاً.' });
        }

        // Generate Token (32 bytes hex)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        // Save to DB
        const { error: updateError } = await supabase
            .from('users')
            .update({
                reset_token: resetToken,
                reset_token_expiry: resetExpires.toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Reset token save error:', updateError);
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        // Send Email
        // Assuming frontend runs on same domain/port in dev? Or 3000? 
        // User is running on `d:\midterm`. Next.js is usually 3000. Backend 5000.
        // We should use process.env.FRONTEND_URL or default to localhost:3000
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        const emailHtml = `
            <div style="text-align: right; direction: rtl; font-family: Arial, sans-serif;">
                <h2>مرحباً ${user.nickname} 👋</h2>
                <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #E85C3F; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        إعادة تعيين كلمة المرور
                    </a>
                </div>
                <p>هذا الرابط صالح لمدة ساعة واحدة.</p>
                <p>إذا لم تطلب هذا التغيير، يرجى تجاهل هذه الرسالة.</p>
            </div>
        `;

        await sendEmail(email, 'إعادة تعيين كلمة المرور - إيواء', emailHtml);

        res.json({ message: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
        }

        // Find user with valid token
        const { data: user, error } = await supabase
            .from('users')
            .select('id, reset_token_expiry')
            .eq('reset_token', token)
            .single();

        if (error || !user) {
            return res.status(400).json({ error: 'الرابط غير صالح أو منتهي الصلاحية' });
        }

        // Check expiry
        // Postgres TIMESTAMP without time zone usually returns a string without 'Z'.
        // Since we stored it as UTC (toISOString), we must treat it as UTC.
        let expiryString = user.reset_token_expiry;
        if (expiryString && typeof expiryString === 'string' && !expiryString.endsWith('Z')) {
            expiryString += 'Z';
        }

        const expiryDate = new Date(expiryString);
        const now = new Date();

        if (!user.reset_token_expiry || expiryDate < now) {
            return res.status(400).json({ error: 'الرابط منتهي الصلاحية' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update User
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                reset_token: null,
                reset_token_expiry: null
            })
            .eq('id', user.id);

        if (updateError) {
            return res.status(500).json({ error: 'فشل تحديث كلمة المرور' });
        }

        res.json({ message: 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/auth/guest
 * Create a guest account for support chat
 */
router.post('/guest', async (req, res) => {
    try {
        const { nickname } = req.body;
        if (!nickname) {
            return res.status(400).json({ error: 'الاسم مطلوب' });
        }

        const guestId = uuidv4();
        // Generate unique dummy credentials
        const email = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}@iwaa.guest`;
        const password = uuidv4(); // Random secure password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Guest User
        const { data: user, error } = await supabase
            .from('users')
            .insert({
                id: guestId,
                email,
                password: hashedPassword,
                nickname: nickname,
                role: 'user',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random`,
                is_verified: true // Auto-verify guests
            })
            .select()
            .single();

        if (error) {
            console.error('Guest creation error:', error);
            return res.status(500).json({ error: 'فشل إنشاء حساب زائر' });
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'تم تسجيل الدخول كزائر',
            token,
            user: {
                id: user.id,
                nickname: user.nickname,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Guest auth error:', error);
        res.status(500).json({ error: 'حدث خطأ غير متوقع' });
    }
});

/**
 * POST /api/auth/guest-message
 * Create unique guest account (if new) and send message to all owners
 * Each guest has their own conversation, visible to all owners
 */
router.post('/guest-message', async (req, res) => {
    try {
        const { name, message, guestToken } = req.body;

        if (!name || !message) {
            return res.status(400).json({ error: 'الاسم والرسالة مطلوبين' });
        }

        let guestUser = null;
        let token = guestToken;

        // Check if guest already has a token (continuing session)
        if (guestToken) {
            try {
                const decoded = jwt.verify(guestToken, process.env.JWT_SECRET);
                const { data: existing } = await supabase
                    .from('users')
                    .select('id, nickname')
                    .eq('id', decoded.userId)
                    .single();
                if (existing) {
                    guestUser = existing;
                }
            } catch (e) {
                // Token invalid, will create new guest
            }
        }

        // Create new guest account if none exists
        if (!guestUser) {
            const uniqueId = crypto.randomBytes(4).toString('hex');
            const guestEmail = `guest_${uniqueId}@iwaa.guest`;
            const guestHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

            const { data: newGuest, error: createError } = await supabase
                .from('users')
                .insert({
                    id: uuidv4(),
                    nickname: `زائر: ${name}`,
                    email: guestEmail,
                    password: guestHash,
                    avatar: null,
                    role: 'user',
                    is_verified: true,
                    created_at: new Date().toISOString()
                })
                .select('id, nickname')
                .single();

            if (createError) {
                console.error('Guest creation error:', createError);
                return res.status(500).json({ error: 'فشل إنشاء حساب الزائر' });
            }

            guestUser = newGuest;

            // Generate token for this guest
            token = jwt.sign(
                { userId: guestUser.id, role: 'user' },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );
        }

        // Find ALL Owners
        const { data: owners } = await supabase
            .from('users') /* FIX: Should fetch EMAIL too */
            .select('id, email')
            .eq('role', 'owner');

        if (!owners || owners.length === 0) {
            return res.status(500).json({ error: 'لا يوجد مالك للنظام' });
        }

        // Send message to ALL owners (one message per owner)
        const messagesToInsert = owners.map(owner => ({
            id: uuidv4(),
            sender_id: guestUser.id,
            receiver_id: owner.id,
            content: message,
            type: 'text',
            created_at: new Date().toISOString(),
            read: false
        }));

        const { error: msgError } = await supabase
            .from('messages')
            .insert(messagesToInsert);

        if (msgError) {
            console.error('Guest message error:', msgError);
            return res.status(500).json({ error: 'فشل إرسال الرسالة' });
        }

        // Emit socket notification to owners
        const io = req.app.get('io');
        if (io) {
            io.emit('new-guest-message', {
                from: guestUser.nickname,
                preview: message.substring(0, 50),
                guestId: guestUser.id,
                timestamp: new Date().toISOString()
            });
        }

        // 🔔 Send Email Notification to Owners
        owners.forEach(owner => {
            if (owner.email && !owner.email.includes('@iwaa.guest')) {
                const emailHtml = `
                    <div style="text-align: right; direction: rtl; font-family: Arial, sans-serif;">
                        <h2>رسالة زائر جديدة 📩</h2>
                        <p><strong>من:</strong> ${guestUser.nickname}</p>
                        <p><strong>الرسالة:</strong></p>
                        <blockquote style="background: #f9f9f9; padding: 15px; border-right: 4px solid #E85C3F;">
                            ${message}
                        </blockquote>
                        <p>يرجى تسجيل الدخول للمنصة للرد.</p>
                    </div>
                `;
                sendEmail(owner.email, `رسالة زائر جديدة من ${guestUser.nickname}`, emailHtml).catch(console.error);
            }
        });

        res.json({
            message: 'تم إرسال رسالتك بنجاح!',
            token,
            guest: { id: guestUser.id, nickname: guestUser.nickname }
        });

    } catch (error) {
        console.error('Guest message error:', error);
        res.status(500).json({ error: 'حدث خطأ غير متوقع' });
    }
});

/**
 * GET /api/auth/guest-messages
 * Fetch messages for a specific guest using their token
 */
router.get('/guest-messages', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({ messages: [] });
        }

        const token = authHeader.split(' ')[1];
        let guestId;

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            guestId = decoded.userId;
        } catch (e) {
            return res.json({ messages: [] });
        }

        // Fetch messages where guest is sender or receiver
        console.log(`Fetching messages for guest: ${guestId}`);
        const { data: messages, error } = await supabase
            .from('messages')
            .select('id, content, sender_id, receiver_id, created_at')
            .or(`sender_id.eq.${guestId},receiver_id.eq.${guestId}`)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) console.error('Supabase fetch error:', error);
        console.log(`Found ${messages?.length || 0} messages for guest ${guestId}`);

        if (error) {
            console.error('Fetch guest messages error:', error);
            return res.json({ messages: [] });
        }

        // Map to isMe format (guest perspective)
        const formatted = messages.map(m => ({
            id: m.id,
            content: m.content,
            isMe: m.sender_id === guestId,
            createdAt: m.created_at
        }));

        res.json({ messages: formatted });

    } catch (error) {
        console.error('Guest messages error:', error);
        res.json({ messages: [] });
    }
});

module.exports = router;
