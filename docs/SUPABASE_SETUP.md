# ربط المشروع بـ Supabase — دليل خطوة بخطوة

> الوقت المتوقع: 15 دقيقة. لا تحتاج أي خادم؛ GitHub Pages يستضيف الواجهة وSupabase يوفر قاعدة البيانات والمصادقة.

## 1) إنشاء مشروع Supabase
1. ادخل إلى <https://supabase.com> → **New project**.
2. اختر اسمًا (مثل `murshid`) وكلمة مرور قوية لقاعدة البيانات، واختر أقرب منطقة لمستخدميك (مثل Frankfurt أو Singapore).

## 2) إنشاء الجداول والصلاحيات
1. من القائمة الجانبية: **SQL Editor → New query**.
2. انسخ محتوى الملف `supabase/migrations/0001_init.sql` كاملًا، والصقه، ثم اضغط **Run**.
3. افتح استعلامًا جديدًا، والصق محتوى `supabase/seed.sql` (التصنيفات والمهارات وأسئلة التقييم والإعدادات) ثم **Run**.

> الملفات قابلة لإعادة التشغيل بأمان، ومختبرة آليًا (`scripts/test-db.sh`).

## 3) إعداد المصادقة
**Authentication → URL Configuration**
- **Site URL**: `https://ezzittech.github.io/mentor_app/`
- **Redirect URLs**: أضف
  - `https://ezzittech.github.io/mentor_app/**`
  - `http://localhost:5173/**` (للتطوير المحلي)

(اختياري) **Authentication → Providers → Email**: يمكنك تعطيل *Confirm email* أثناء التجربة فقط.

## 4) نسخ المفاتيح العامة
**Project Settings → API** (أو **Data API**):
- `Project URL` → هذا هو `VITE_SUPABASE_URL`
- `anon` / `publishable` key → هذا هو `VITE_SUPABASE_ANON_KEY`

⚠️ **لا تستخدم أبدًا** مفتاح `service_role` / `secret` في الواجهة أو في GitHub.
المفتاح العام آمن للنشر لأن الحماية الحقيقية تتم عبر سياسات RLS في قاعدة البيانات.

## 5) إضافة المفاتيح إلى GitHub
في المستودع: **Settings → Secrets and variables → Actions → Variables → New repository variable**
| الاسم | القيمة |
|---|---|
| `VITE_SUPABASE_URL` | رابط المشروع |
| `VITE_SUPABASE_ANON_KEY` | المفتاح العام |
| `VITE_DEMO_MODE` | `true` لإظهار أزرار المعاينة في صفحة الدخول، أو `false` في الإنتاج |

ثم: **Settings → Pages → Source: GitHub Actions**. كل `push` إلى `main` ينشر الموقع تلقائيًا على
`https://ezzittech.github.io/mentor_app/`.

## 6) إنشاء أول مسؤول (Admin)
1. افتح الموقع وسجّل حسابًا جديدًا ببريدك.
2. في **SQL Editor** شغّل الملف `supabase/make_admin.sql` بعد تغيير البريد فيه.
3. سجّل الخروج والدخول مجددًا — سيظهر لك مسار الإدارة. من هناك يمكنك منح أدوار المرشد/المشرف لأي مستخدم.

## 7) التشغيل المحلي
```bash
cp .env.example .env    # ثم ضع القيم من الخطوة 4
npm install
npm run dev             # http://localhost:5173
```
بدون ملف `.env` يعمل التطبيق في **وضع المعاينة** ببيانات تجريبية في الذاكرة فقط.

## ما الذي يتم في قاعدة البيانات تلقائيًا؟
- عند التسجيل: إنشاء `profile` + دور `mentee` (ودور `mentor` وملف مسودة إذا اختار «أريد أن أكون مرشدًا»).
- قبول الطلب (`decide_request`): ينشئ علاقة الإرشاد + طلب دفع معلق بالعمولة + إشعار + سجل تدقيق.
- التسليم/المراجعة: تحديث حالة المهمة وإرسال الإشعارات.
- التقييمات: تحديث متوسط تقييم المرشد.
- كل إجراء حساس (أدوار، اعتماد مرشد، مدفوعات، إعدادات) يُكتب في `audit_logs`.
