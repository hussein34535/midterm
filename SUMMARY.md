# إِواء - ملخص سريع

## ❓ إيه هو؟
منصة صحة نفسية عربية تربط المستخدمين بمتخصصين عبر محادثات فورية وجلسات فيديو.

## 🛠️ التقنيات
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS
- **Backend**: Express.js + Socket.io
- **Database**: Supabase (PostgreSQL)
- **Video**: Agora SDK

## 📁 الهيكل
```
iwaa/
├── app/           → صفحات Next.js (messages, courses, admin...)
├── backend/       → Express API (routes, middleware, server.js)
├── components/    → React components (UI, layout)
└── public/        → صور، ستيكرز، أفاتارات
```

## 🚀 التشغيل
```bash
# Frontend (localhost:3000)
npm install && npm run dev

# Backend (localhost:5000)
cd backend && npm install && npm run dev
```

## 📄 ملفات البيئة
- `.env.local` → Frontend (SUPABASE_URL, API_URL, AGORA_APP_ID)
- `backend/.env` → Backend (JWT_SECRET, SUPABASE_SERVICE_KEY, RESEND_API_KEY)

## 🔑 الصفحات المهمة
| الصفحة | الرابط |
|--------|--------|
| الرسائل | `/messages` |
| الكورسات | `/courses` |
| لوحة المدير | `/admin` |
| الإعدادات | `/settings` |

## 📡 APIs رئيسية
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/messages/conversations` - المحادثات
- `POST /api/messages/:id` - إرسال رسالة
- `GET /api/courses` - الكورسات
