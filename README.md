# تطبيق Supabase

هذا المشروع هو تطبيق React مع TypeScript يستخدم Supabase كقاعدة بيانات.

## متطلبات التشغيل

- Node.js (نسخة 14 أو أحدث)
- حساب على Supabase

## الإعداد

1. قم بنسخ المشروع:
```bash
git clone [رابط-المشروع]
cd supabase-app
```

2. قم بتثبيت التبعيات:
```bash
npm install
```

3. قم بإنشاء ملف `.env` وأضف متغيرات البيئة الخاصة بـ Supabase:
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. قم بتشغيل المشروع:
```bash
npm run dev
```

## الهيكل

- `src/supabaseClient.ts` - تكوين Supabase
- `src/App.tsx` - المكون الرئيسي للتطبيق
- `src/main.tsx` - نقطة الدخول للتطبيق
