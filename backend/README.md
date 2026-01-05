# Sakina Backend API

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production
npm start
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | تسجيل مستخدم جديد |
| POST | `/api/auth/login` | تسجيل الدخول |
| POST | `/api/auth/verify` | التحقق من التوكن |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | الملف الشخصي |
| PUT | `/api/users/me` | تحديث الملف الشخصي |

### Sessions (Voice Calls)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/create` | إنشاء جلسة |
| GET | `/api/sessions/:id` | تفاصيل جلسة |
| POST | `/api/sessions/:id/join` | الانضمام لجلسة |
| POST | `/api/sessions/:id/end` | إنهاء جلسة |
| GET | `/api/sessions` | كل الجلسات النشطة |

## Environment Variables

```env
PORT=5000
JWT_SECRET=your_secret_key
AGORA_APP_ID=your_agora_app_id
```

## Database

Currently using in-memory storage. To connect a real database:
- **Supabase**: Add `@supabase/supabase-js`
- **MongoDB**: Add `mongoose`
- **PostgreSQL**: Add `pg`
