<div align="center">

<img src="banner.svg" alt="کارت پستال دیجیتال" width="100%">

<img src="typing.svg" alt="کارت دعوت و تبریک خودت رو بساز" width="700">

</div>

<div dir="rtl">

## ✨ این پروژه چیه؟

یه سایت برای ساخت **کارت پستال دیجیتال**؛ هر کسی با شماره تلفن و رمز ثبت‌نام می‌کنه و کارت تبریک یا دعوت خودش رو
با متن، شعر، فونت، رنگ، عکس، آهنگ و انیمیشن دلخواه می‌سازه و **لینکش** رو می‌فرسته. گیرنده با یه لمس، پاکت رو باز می‌کنه
و کارت با موسیقی و متنِ حرف‌به‌حرف نوشته‌شده نمایش داده می‌شه.

| 💌 | ویژگی |
|---|---|
| 🔐 | ثبت‌نام و ورود با شماره تلفن + رمز |
| 🎨 | ۴ رنگ‌بندی، ۴ فونت، ۴ عکس پیش‌فرض و آپلود عکس دلخواه |
| 🎵 | ۳ آهنگ پیش‌فرض و آپلود آهنگ دلخواه |
| 🪄 | پاکت نامه / قلب تپنده، قلب‌های شناور، نوشتن حرف‌به‌حرف |
| 🛠 | پنل ادمین: کاربران، کارت‌ها و گزارش فعالیت‌ها |

## 🚀 راه‌اندازی روی Railway

### ۱) ریپازیتوری
پروژه رو روی GitHub بذار (`.gitignore` جلوی آپلود `node_modules` و `.env` رو می‌گیره).

### ۲) ساخت پروژه
railway.com ← **New Project** ← **Deploy from GitHub repo** ← ریپازیتوری رو انتخاب کن. ریلوی خودش `npm install` و `npm start` رو اجرا می‌کنه.

### ۳) دیتابیس
داخل همون پروژه: **+ New** ← **Database** ← **Add PostgreSQL**.
جدول‌ها دستی ساخته نمی‌شن؛ سرور در هر استارت `schema.sql` رو اجرا می‌کنه.

### ۴) متغیرها (در **سرویس وب**، نه Postgres)
تب **Variables** ← **Raw Editor** ← این رو جایگذاری کن:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
ADMIN_ID=admin
ADMIN_PASSWORD=یک-رمز-قوی-بذار
NODE_ENV=production
```

> اگه اسم سرویس دیتابیس چیزی غیر از `Postgres` بود، همون رو داخل `${{...}}` بنویس.

### ۵) دامنه و تست
**Settings** ← **Networking** ← **Generate Domain**.

- سایت: `https://دامنه-تو`
- ادمین: `https://دامنه-تو/admin`
- سلامت دیتابیس: `https://دامنه-تو/api/health` باید `{"ok":1}` بده

> نیازی به Volume نیست؛ همه‌چیز از جمله عکس و آهنگ‌های آپلودی داخل Postgres ذخیره می‌شه.

## 💻 اجرای محلی

```bash
docker run --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postcards -p 5432:5432 -d postgres:16
npm install
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postcards
export ADMIN_PASSWORD=change-me
npm start   # http://localhost:3000
```

## 🗂 ساختار
همهٔ فایل‌ها داخل یک پوشه (ریشهٔ ریپازیتوری) هستن، بدون زیرپوشه:

```
server.js     API، ورود/ثبت‌نام، آپلود، ادمین
package.json  وابستگی‌ها
schema.sql    ساختار جدول‌ها
index.html    صفحهٔ ورود و ثبت‌نام
app.html      پنل کاربر و سازندهٔ کارت
admin.html    پنل ادمین
view.html     صفحهٔ نمایش کارت (لینک اشتراکی)
card.js       موتور نمایش کارت و پیش‌فرض‌ها
style.css     استایل‌ها
*.svg         انیمیشن‌های همین README
```

## 🧩 افزودن پیش‌فرض جدید
`PRESETS` و `IMG` و `TUNES` در `card.js` رو ویرایش کن، و لیست‌های مجاز در `clean()` داخل `server.js` رو هم هماهنگ کن.

## ⚠️ نکته‌ها
- شمارهٔ تلفن با پیامک تأیید نمی‌شه (نیاز به سرویس پیامک مثل کاوه‌نگار).
- آپلود: png/jpg/webp و mp3/ogg/wav/m4a، تا ۳ مگابایت و ۳۰ فایل برای هر کاربر. SVG عمداً بلاک شده.

</div>

<div align="center">

<img src="footer.svg" alt="ساخته‌شده با عشق" width="100%">

</div>
