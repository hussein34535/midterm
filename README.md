# إيواء - منصة الدعم والتطوير الذاتي

<div align="center">

![إيواء Logo](public/logo.png)

**منصة عربية متكاملة للتدريب والإرشاد النفسي عن بُعد**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Agora](https://img.shields.io/badge/Agora-VoIP-099DFD?style=flat-square)](https://agora.io/)

</div>

---

## 🌟 نظرة عامة

**إيواء** هي منصة عربية متكاملة تربط بين الأخصائيين والمستفيدين، توفر:

- 🎓 **كورسات تفاعلية** مع جلسات صوتية جماعية
- 💬 **شات جماعي** لكل كورس (Group Chats)
- 📅 **جدولة ذكية** للجلسات من داخل المحادثات
- 📞 **مكالمات صوتية** عالية الجودة (Agora RTC)
- 👥 **إدارة كاملة** للمستخدمين والأخصائيين

---

## 🛠 التقنيات المستخدمة

| Frontend | Backend | Database | Real-time |
|----------|---------|----------|-----------|
| Next.js 15 | Node.js / Express | Supabase (PostgreSQL) | Socket.IO |
| React 19 | JWT Auth | Row Level Security | Agora RTC |
| TailwindCSS | RESTful API | UUID Primary Keys | WebSockets |

---

## 📁 هيكل المشروع

```
midterm/
├── app/                    # Next.js App Router
│   ├── admin/              # لوحة الأدمن
│   ├── specialist/         # لوحة الأخصائي
│   ├── dashboard/          # لوحة المستخدم
│   ├── messages/           # نظام المحادثات
│   └── session/[id]/       # غرفة الجلسة الصوتية
├── backend/
│   ├── routes/             # API Endpoints
│   │   ├── auth.js         # تسجيل الدخول
│   │   ├── courses.js      # الكورسات
│   │   ├── messages.js     # الرسائل والشات
│   │   └── admin.js        # إدارة النظام
│   └── server.js           # Express Server
├── components/
│   ├── voice/              # مكونات المكالمة الصوتية
│   └── layout/             # Header, Footer
├── database/
│   └── schema.sql          # Database Schema
└── public/                 # Static Assets
```

---

## 🚀 التشغيل المحلي

### 1. تثبيت المتطلبات

```bash
# Frontend
cd midterm
npm install

# Backend
cd backend
npm install
```

### 2. إعداد المتغيرات البيئية

**Frontend** (`app/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Backend** (`backend/.env`):
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
```

### 3. إعداد قاعدة البيانات

شغّل محتويات `database/schema.sql` في Supabase SQL Editor.

### 4. التشغيل

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd midterm && npm run dev
```

---

## 👤 الأدوار والصلاحيات

| الدور | الصلاحيات |
|-------|----------|
| **Owner** | إدارة كاملة، إنشاء كورسات، تعيين أخصائيين |
| **Specialist** | إدارة جلساته، شات مع المشتركين، جدولة |
| **User** | التسجيل في الكورسات، حضور الجلسات، الشات |

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - تسجيل جديد
- `POST /api/auth/login` - تسجيل دخول

### Courses
- `GET /api/courses` - جلب الكورسات
- `POST /api/courses/:id/payment` - الدفع والتسجيل

### Messages
- `GET /api/messages/conversations` - المحادثات
- `GET /api/messages/:id?type=group` - رسائل المحادثة
- `POST /api/messages/:id/schedule` - جدولة جلسة

---

## 🎨 الثيم والألوان

المنصة تستخدم ثيم "Warm & Nostalgic" بألوان دافئة:

- **Primary**: Terracotta `oklch(0.62 0.18 30)`
- **Background**: Cream `oklch(0.97 0.008 70)`
- **Accent**: Sunset Orange `oklch(0.75 0.12 40)`

---

## 📄 الرخصة

هذا المشروع للاستخدام التعليمي والتطويري.

---

<div align="center">

**صُنع بـ ❤️ لمجتمعنا العربي**

</div>
