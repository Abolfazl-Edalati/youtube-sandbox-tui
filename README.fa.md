فارسی | [English](README.md)

<div dir="rtl">

# 🎬 youtube-sandbox-tui

یک رابط کاربری ترمینالی برای [youtube-sandbox](https://github.com/arbtech/youtube-sandbox) — دانلود ویدیوهای یوتیوب از طریق GitHub Actions، مانیتور کردن وضعیت دانلود، مرور فایل‌های دانلود شده و مدیریت ریپو، همه بدون خروج از ترمینال.

> [!NOTE]
> این اپلیکیشن با کمک هوش مصنوعی (Claude ساخت Anthropic) توسعه داده شده است.

---

## نحوه کارکرد

youtube-sandbox-tui یک رابط کاربری برای ورک‌فلوی GitHub Actions پروژه‌ی [youtube-sandbox](https://github.com/arbtech/youtube-sandbox) است. این ورک‌فلو کامیت‌هایی را که پیام‌شان با `yt-dlp:` شروع می‌شه رصد می‌کنه و به صورت خودکار ویدیوی مربوطه رو دانلود کرده و توی پوشه‌ی `downloads/` ریپو ذخیره می‌کنه.

این TUI همه کارها رو از طرف شما انجام می‌ده:

- ساختن و پوش کردن کامیت‌های trigger از طریق GitHub API
- مانیتور کردن وضعیت ورک‌فلوی Actions در لحظه
- مرور، دانلود و حذف فایل‌ها از ریپو

---

## پیش‌نیازها

| نیاز                                                                           | نسخه             | توضیحات                                 |
| ------------------------------------------------------------------------------ | ---------------- | --------------------------------------- |
| [Bun](https://bun.sh)                                                          | نسخه ۱.۰ به بالا | محیط اجرا و مدیریت پکیج                 |
| ریپوی فورک شده‌ی [youtube-sandbox](https://github.com/arbtech/youtube-sandbox) | —                | ابتدا راهنمای تنظیمات اون رو دنبال کنید |
| Personal Access Token گیتهاب                                                   | —                | به پایین مراجعه کنید                    |

### ساخت Personal Access Token گیتهاب

۱. برید به **GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-Grained Tokens**
۲. روی **Generate new token** کلیک کنید
۳. در بخش **Repository access**، گزینه‌ی **Only select repositories** رو انتخاب کنید و ریپوی فورک شده رو مشخص کنید
۴. دسترسی‌های زیر رو فعال کنید:

| دسترسی   | سطح                                     |
| -------- | --------------------------------------- |
| Contents | خواندن و نوشتن                          |
| Actions  | فقط خواندن                              |
| Metadata | فقط خواندن (به‌صورت خودکار اضافه می‌شه) |

۵. توکن تولید شده رو کپی کنید — هنگام اولین اجرا بهش نیاز دارید

---

## نصب

</div>

```bash
# کلون کردن ریپو
git clone https://github.com/your-username/youtube-sandbox-tui
cd youtube-sandbox-tui

# نصب وابستگی‌ها
bun install

# اجرای برنامه
bun start
```

<div dir="rtl">

---

## اولین اجرا

در اولین اجرا (یا در صورت نبود فایل کانفیگ)، برنامه به‌صورت خودکار صفحه‌ی **تنظیمات** رو باز می‌کنه و سه چیز ازتون می‌خواد:

</div>

```
GitHub Personal Access Token   →  توکن fine-grained شما (ورودی مخفی است)
Repo Owner                     →  نام کاربری گیتهاب صاحب ریپوی فورک شده
Repo Name                      →  نام ریپوی فورک شده (مثلاً youtube-sandbox)
```

<div dir="rtl">

این اطلاعات با استفاده از [`conf`](https://github.com/sindresorhus/conf) به صورت محلی ذخیره می‌شن و بین نشست‌ها باقی می‌مونن. هر زمان که خواستید می‌تونید از طریق گزینه‌ی **Configure** در منوی اصلی اون‌ها رو به‌روزرسانی کنید.

---

## نحوه استفاده

### صفحه اصلی

</div>

```
🎬 YouTube Sandbox TUI

  ⬇  New Download
  📁  Browse Files
  ⚙️  Configure
```

<div dir="rtl">

با **↑ / ↓** جابجا بشید و با **Enter** تأیید کنید.

---

### ⬇ دانلود جدید

یک فرم کوتاه برای تنظیم دانلود:

**مرحله ۱ — لینک**
هر لینک یوتیوب (ویدیو یا پلی‌لیست) رو پیست کنید و **Enter** بزنید.

**مرحله ۲ — کیفیت**

</div>

```
  Best (default)
  1080p
  720p
  480p
```

<div dir="rtl">

**مرحله ۳ — گزینه‌ها**
هر ترکیبی از گزینه‌ها رو فعال کنید، بعد **Continue** رو انتخاب کنید:

</div>

```
  ⬜ Audio only (MP3)
  ⬜ Download subtitles
  ⬜ Full playlist
```

<div dir="rtl">

**مرحله ۴ — تأیید**
پیام کامیتی که پوش خواهد شد رو بررسی کنید، بعد تأیید کنید تا دانلود شروع بشه:

</div>

```
yt-dlp: https://youtu.be/xxxxxxxxxxx quality: 1080 subtitles: true
```

<div dir="rtl">

بعد از تأیید، برنامه یک کامیت به ریپوی شما پوش می‌کنه و به صورت خودکار به صفحه‌ی **وضعیت** می‌ره.

---

### 📡 صفحه وضعیت

هر ۵ ثانیه GitHub Actions API رو poll می‌کنه و وضعیت فعلی ورک‌فلوی تریگر شده رو نشون می‌ده:

</div>

```
📡 Workflow Status

⠋ IN_PROGRESS
https://github.com/your-username/youtube-sandbox/actions/runs/...
```

<div dir="rtl">

بعد از اتمام:

</div>

```
✅ SUCCESS
Press F to browse files or Q for home.
```

<div dir="rtl">

| کلید  | عملکرد               |
| ----- | -------------------- |
| **F** | رفتن به صفحه فایل‌ها |
| **Q** | بازگشت به صفحه اصلی  |

---

### 📁 مرور فایل‌ها

محتویات پوشه‌ی `downloads/` ریپوی شما رو نشون می‌ده. ویدیوهای بزرگی که به‌صورت خودکار به بخش‌های `.zip` تقسیم شدن به صورت پوشه نمایش داده می‌شن و می‌تونید واردشون بشید.

</div>

```
📁 Downloads

4 items — ↑↓ navigate · Enter download · D delete · Q home

  📁  big-video/
  📄  short-clip.mp4         (42.3 MB)
  📄  podcast-episode.mp3    (18.7 MB)
  📄  tutorial.mp4           (87.1 MB)
```

<div dir="rtl">

| کلید        | عملکرد                                                   |
| ----------- | -------------------------------------------------------- |
| **↑ / ↓**   | جابجایی در لیست                                          |
| **Enter**   | دانلود فایل انتخاب شده به `~/Downloads` یا باز کردن پوشه |
| **D**       | حذف فایل یا پوشه انتخاب شده از ریپو (با تأیید)           |
| **Q / Esc** | رفتن به یک سطح بالاتر (داخل پوشه) یا بازگشت به صفحه اصلی |

**دانلود** فایل رو مستقیماً به `~/Downloads` استریم می‌کنه با نمایش پیشرفت زنده:

</div>

```
⠋ Downloading...
67.3%  (57.0 MB / 87.1 MB)
```

<div dir="rtl">

**حذف پوشه** (ویدیوی تقسیم شده) به صورت خودکار تمام فایل‌های داخلش رو یکی یکی حذف می‌کنه. گیتهاب پوشه‌ی خالی رو خودکار برمی‌داره. تمام کامیت‌های حذف شامل `[skip ci]` می‌شن تا به اشتباه دانلود جدیدی تریگر نشه.

---

### ⚙️ تنظیمات

هر زمان می‌تونید توکن، نام صاحب ریپو یا نام ریپوی ذخیره شده رو به‌روز کنید. فیلد توکن هنگام ورود مخفی نمایش داده می‌شه.

---

## ساختار پروژه

</div>

```
youtube-sandbox-tui/
├── src/
│   ├── index.tsx                 # نقطه ورود
│   ├── types.ts                  # تایپ‌های مشترک (Screen, AppConfig, FileEntry, ...)
│   ├── lib/
│   │   ├── config.ts             # خواندن/نوشتن کانفیگ با conf
│   │   └── github.ts             # تمام فراخوانی‌های GitHub API (wrapper اوکتوکیت)
│   └── components/
│       ├── App.tsx               # روتر صفحات
│       ├── HomeScreen.tsx
│       ├── ConfigScreen.tsx
│       ├── DownloadScreen.tsx
│       ├── StatusScreen.tsx
│       └── FilesScreen.tsx
├── package.json
└── tsconfig.json
```

<div dir="rtl">

---

## وابستگی‌ها

| پکیج                                                                   | هدف                           |
| ---------------------------------------------------------------------- | ----------------------------- |
| [`ink`](https://github.com/vadimdemedes/ink)                           | رندرر TUI مبتنی بر React      |
| [`ink-text-input`](https://github.com/vadimdemedes/ink-text-input)     | کامپوننت ورودی متن            |
| [`ink-select-input`](https://github.com/vadimdemedes/ink-select-input) | منوهای انتخابی با کلیدهای جهت |
| [`ink-spinner`](https://github.com/vadimdemedes/ink-spinner)           | اسپینرهای بارگذاری            |
| [`octokit`](https://github.com/octokit/octokit.js)                     | SDK رسمی GitHub API           |
| [`conf`](https://github.com/sindresorhus/conf)                         | ذخیره‌سازی کانفیگ محلی پایدار |
| [`chalk`](https://github.com/chalk/chalk)                              | رنگ‌آمیزی ترمینال             |

---

## محدودیت‌ها و نکات مهم

- **حجم ریپوی گیتهاب** — گیتهاب توصیه می‌کنه ریپوها زیر ۵ گیگابایت بمونن. ویدیوها رو به صورت محلی دانلود کنید و بعد از ریپو حذف‌شون کنید.
- **انقضای کوکی** — ورک‌فلوی youtube-sandbox از کوکی‌های یوتیوب شما برای دور زدن تشخیص ربات استفاده می‌کنه. این کوکی‌ها هر ۲ تا ۳ ماه منقضی می‌شن. اگه دانلودها شروع به شکست خوردن کردن، مراحل تنظیم کوکی رو در [README پروژه youtube-sandbox](https://github.com/arbtech/youtube-sandbox) دوباره انجام بدید.
- **یک لینک در هر کامیت** — ورک‌فلوی فقط اولین لینک `yt-dlp:` توی پیام کامیت رو پردازش می‌کنه.
- **سهمیه Actions** — GitHub Actions برای ریپوهای خصوصی محدودیت ماهانه داره (۲۰۰۰ دقیقه). فورک‌های عمومی نامحدود هستن.
- **فقط استفاده شخصی** — دانلود محتوای دارای کپی‌رایت ممکنه با شرایط خدمات یوتیوب و قوانین جاری تداخل داشته باشه. مسئولانه و فقط برای محتوایی که حق دانلود دارید استفاده کنید.

---

## لایسنس

MIT

---

> **سلب مسئولیت هوش مصنوعی:** این پروژه با کمک [Claude](https://claude.ai) ساخت Anthropic توسعه داده شده. تمام کدها توسط نویسنده‌ی پروژه بررسی، تست و اصلاح شده‌اند.

</div>
