# TaskFlow — Kanban Proje Yönetim Uygulaması

## Kurulum

### 1. Supabase Kurulumu
1. [supabase.com](https://supabase.com) üzerinden yeni proje oluştur
2. **SQL Editor** > **New Query** > `supabase/schema.sql` içeriğini yapıştır ve çalıştır
3. **Authentication** > **Providers** > **Google** aktif et (opsiyonel)
4. **Authentication** > **URL Configuration** > Site URL: `http://localhost:3000`
5. Redirect URLs'e ekle: `http://localhost:3000/auth/callback`

### 2. Environment Variables
```bash
cp .env.local.example .env.local
```
`.env.local` dosyasını düzenle:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Bağımlılıkları Kur ve Çalıştır
```bash
npm install
npm run dev
```

### 4. Vercel Deploy
```bash
npm i -g vercel
vercel
```
Vercel dashboard'da Environment Variables'a Supabase bilgilerini ekle.

## Özellikler
- Sürükle-bırak Kanban (dnd-kit)
- Google OAuth + Email doğrulama
- Şifre sıfırlama
- Profil yönetimi (kullanıcı adı, rol)
- Board paylaşımı (viewer/editor/admin)
- Realtime güncelleme (Supabase Realtime)
- Kart etiketleri, son tarih, atama
- Sütun ve kart sıralaması (LexoRank)
- Mobil dokunmatik desteği
