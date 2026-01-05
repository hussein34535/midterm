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
 * Register a new user
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

        // Create user in Supabase
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                id: uuidv4(),
                nickname,
                email,
                password: hashedPassword,
                avatar: avatar || null,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email, role: newUser.role || 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user (without password)
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            message: 'تم إنشاء الحساب بنجاح',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء التسجيل' });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'البريد الإلكتروني وكلمة المرور مطلوبان'
            });
        }

        // Find user in Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({
                error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user (without password)
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
 * Verify JWT token
 */
router.post('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'التوكن غير موجود' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('id, nickname, email, avatar, created_at')
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

module.exports = router;
