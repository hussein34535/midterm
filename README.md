# إِواء - Iwaa Mental Health Platform

<div align="center">

![Iwaa Logo](public/logo.png)

**منصة عربية متكاملة للصحة النفسية والدعم العاطفي**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-white?logo=socket.io)](https://socket.io/)

</div>

---

## 📋 نظرة عامة

**إِواء** هي منصة صحة نفسية شاملة تربط المستخدمين بمتخصصين معتمدين للحصول على الدعم النفسي والعاطفي. تتميز بواجهة مستخدم سلسة باللغة العربية مع دعم المحادثات الفورية والجلسات المرئية.

---

## ✨ المميزات الرئيسية

### 👥 للمستخدمين
- 🔐 **تسجيل دخول آمن** - نظام مصادقة كامل مع تأكيد البريد الإلكتروني
- 💬 **محادثات فورية** - دردشة لحظية مع المتخصصين
- 📞 **جلسات فيديو** - مكالمات فيديو آمنة عبر Agora
- 📚 **كورسات تعليمية** - محتوى تثقيفي للصحة النفسية
- 😊 **ستيكرز مخصصة** - إضافة لمسة شخصية للمحادثات
- 🎨 **أفاتارات متنوعة** - اختيار صورة شخصية من مكتبة غنية

### 👨‍⚕️ للمتخصصين
- 📊 **لوحة تحكم** - إدارة الجلسات والعملاء
- 📅 **جدولة المواعيد** - تنظيم جلسات الاستشارة
- 💰 **إدارة المدفوعات** - تتبع الأرباح والفواتير

### 🛠️ للمديرين
- 👤 **إدارة المستخدمين** - موافقة/رفض المتخصصين
- 📈 **إحصائيات** - تقارير شاملة عن المنصة
- 🎫 **كوبونات خصم** - إنشاء وإدارة العروض
- ⚙️ **إعدادات النظام** - التحكم الكامل بالمنصة

---

## 🏗️ البنية التقنية

```
iwaa/
├── app/                    # Next.js App Router (Frontend)
│   ├── admin/             # لوحة تحكم المديرين
│   ├── courses/           # صفحات الكورسات
│   ├── dashboard/         # لوحة تحكم المتخصصين
│   ├── messages/          # نظام المحادثات
│   ├── session/           # جلسات الفيديو
│   ├── settings/          # إعدادات المستخدم
│   ├── specialist/        # ملفات المتخصصين
│   └── ...                # صفحات أخرى
│
├── backend/               # Express.js API Server
│   ├── routes/            # API Endpoints
│   │   ├── auth.js        # المصادقة والتسجيل
│   │   ├── messages.js    # المحادثات والرسائل
│   │   ├── courses.js     # الكورسات
│   │   ├── sessions.js    # الجلسات
│   │   ├── admin.js       # وظائف المدير
│   │   └── ...
│   ├── middleware/        # JWT Authentication
│   ├── utils/             # Email helpers
│   └── server.js          # Entry point
│
├── components/            # React Components
│   ├── ui/               # Shadcn/UI components
│   └── layout/           # Header, Footer, Nav
│
├── lib/                   # Utilities
│   ├── supabase/         # Supabase client
│   └── utils.ts          # Helper functions
│
└── public/               # Static assets
    ├── avatars/          # صور الأفاتار
    └── stickers/         # الستيكرز
```

---

## 🛠️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|----------|
| **Next.js 16** | Frontend Framework |
| **React 19** | UI Library |
| **TypeScript** | Type Safety |
| **Tailwind CSS 4** | Styling |
| **Shadcn/UI** | Component Library |
| **Express.js** | Backend API |
| **Supabase** | Database & Storage |
| **Socket.io** | Real-time Messaging |
| **Agora** | Video Calls |
| **JWT** | Authentication |
| **Resend/Nodemailer** | Email Service |

---

## 🚀 التشغيل المحلي

### المتطلبات
- Node.js 18+
- npm أو yarn
- حساب Supabase
- حساب Agora (للفيديو)

### الخطوات

#### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd iwaa
```

#### 2. إعداد Frontend
```bash
npm install
```

إنشاء ملف `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
```

#### 3. إعداد Backend
```bash
cd backend
npm install
```

إنشاء ملف `backend/.env`:
```env
PORT=5000
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
RESEND_API_KEY=your_resend_api_key
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
```

#### 4. تشغيل المشروع
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

---

## 📱 الصفحات الرئيسية

| الصفحة | الرابط | الوصف |
|--------|--------|-------|
| الرئيسية | `/` | الصفحة الترحيبية |
| تسجيل الدخول | `/login` | دخول المستخدمين |
| التسجيل | `/register` | إنشاء حساب جديد |
| الكورسات | `/courses` | عرض الكورسات المتاحة |
| الرسائل | `/messages` | المحادثات الفورية |
| الجلسة | `/session/[id]` | جلسة الفيديو |
| الإعدادات | `/settings` | إعدادات الحساب |
| لوحة التحكم | `/admin` | إدارة المنصة (للمديرين) |

---

## 🔌 API Endpoints الرئيسية

### المصادقة (`/api/auth`)
- `POST /register` - تسجيل مستخدم جديد
- `POST /login` - تسجيل الدخول
- `POST /verify-email` - تأكيد البريد
- `POST /forgot-password` - استعادة كلمة المرور

### الرسائل (`/api/messages`)
- `GET /conversations` - جلب المحادثات
- `GET /:id` - جلب رسائل محادثة
- `POST /:id` - إرسال رسالة
- `POST /stickers/save` - حفظ ستيكر

### الكورسات (`/api/courses`)
- `GET /` - جلب الكورسات
- `GET /:id` - تفاصيل كورس
- `POST /enroll` - التسجيل بكورس

---

## 🔒 الأمان

- ✅ تشفير كلمات المرور باستخدام bcrypt
- ✅ JWT tokens للمصادقة
- ✅ Row Level Security في Supabase
- ✅ CORS محدد للـ origins المصرح بها
- ✅ Input validation على جميع الـ endpoints
- ✅ NSFW detection للصور

---

## 📧 التواصل

للمساعدة أو الاستفسارات:
- 📧 Email: support@iwaa.com

---

<div align="center">

**صنع بـ ❤️ لدعم الصحة النفسية في العالم العربي**

</div>
