# TaskFlow — Collaborative Kanban Board

🔗 **[taskflow-pi-gray.vercel.app](https://taskflow-pi-gray.vercel.app)**

Next.js 14 App Router, Supabase ve Tailwind CSS ile geliştirilmiş, gerçek zamanlı çoklu kullanıcı desteğine sahip Kanban proje yönetim uygulaması.

---

## Özellikler

### Kimlik Doğrulama & Hesap
- E-posta / şifre ile kayıt ve giriş
- Google OAuth ile tek tıkla giriş
- E-posta doğrulama akışı
- Şifre sıfırlama (e-posta ile link)
- Şifre değiştirme (profil sayfasından)
- Hesap silme

### Board & İşbirliği
- Board oluşturma, düzenleme, silme
- **Board paylaşımı:** kullanıcı adıyla davet (viewer / editor / admin rolleri)
- Public/private görünürlük kontrolü
- Link üzerinden paylaşım ve link izni (viewer/editor)
- Üye listesi yönetimi — izin değiştirme, üye çıkarma
- Board başlığında aktif üye avatarları

### Kanban Canvas
- Sürükle-bırak sütun ve kart yeniden sıralama (dnd-kit)
- Kartları sütunlar arası taşıma
- Sütun ekleme, yeniden adlandırma, silme
- Kart detay modalı: başlık, açıklama, son tarih, atanan kişi, etiketler
- Son düzenleyen kişiyi renkli sol kenar çizgisiyle gösterme
- Gerçek zamanlı senkronizasyon — aynı board'da çalışan kullanıcılar değişiklikleri anında görür

### Profil
- Kullanıcı adı ve tam ad düzenleme
- Rol seçimi (intern / junior / mid / senior / lead)
- Şifre değiştirme
- Hesap silme

---

## Teknik Kararlar

### Sıralamanın Sağlamlığı: LexoRank
Sütun ve kart sıralaması tamsayı indeksleri yerine **LexoRank** algoritmasıyla yönetilir. Bir kart/sütun taşındığında yalnızca o öğenin `order_key` değeri güncellenir; tüm listeyi yeniden numaralandırmak gerekmez. Sayfa yenilendiğinde sıralama veritabanından birebir korunur, sunucu taraflı sıralama uygulanır.

### Kütüphane Seçimi
| İhtiyaç | Seçim | Neden |
|---|---|---|
| Sürükle-bırak | `@dnd-kit/core` | React 18 concurrent mode uyumlu, erişilebilirlik desteği, dokunmatik ekran desteği dahil |
| Auth & DB | Supabase | PostgreSQL + Row Level Security + Realtime tek pakette; kendi auth sunucusu gerektirmiyor |
| Stil | Tailwind CSS | Utility-first, dark mode için CSS değişkeni tabanlı tema |
| Framework | Next.js 14 App Router | Server Components ile sunucu taraflı veri çekimi, route bazlı layout grupları |

### Veri Modeli Tutarlılığı
Hiyerarşi `boards → columns → cards` biçiminde kurulmuş olup her katman bir üstüne `ON DELETE CASCADE` ile bağlı. Board silindiğinde sütunlar ve kartlar otomatik olarak temizlenir. `board_members` tablosu sahiplikten ayrı tutulur; `owner_id` boards tablosunda, üyelik board_members'ta yönetilir.

### Sürükle-Bırak Görsel İpuçları
- Sürüklenen öğe `opacity-30 scale-105 rotate-1` ile soluklaşır
- `DragOverlay` ile orijinal pozisyon boş kalır, taşınan öğe bağımsız katmanda render edilir
- Dokunmatik cihazlarda 250ms uzun basma ile sürükleme başlar (`TouchSensor`)

### Mobil Kullanılabilirlik
- `touch-action: none` ve `select-none` sürükleme sırasında sayfa kaymasını engeller
- Tüm layout'lar `overflow-x-auto` ile yatay kaydırılabilir
- Buton ve dokunma alanları minimum 44px hedef boyutuna uygun

### Mimari Tutarlılığı
- `(auth)` ve `(dashboard)` route gruplarıyla layout tekrarı önlendi
- Server Components veri çekimini üstlenir; client bileşenler yalnızca etkileşim için `'use client'` alır
- Supabase RLS tüm izin kontrolünü veritabanı katmanında yönetir — frontend izin kontrolüne güvenilmez
- `SECURITY DEFINER` fonksiyonlarla (`get_my_board_ids`, `get_my_admin_board_ids`) RLS politikalarındaki döngüsel bağımlılık kırılır

---

## Kurulum

### 1. Supabase Kurulumu
1. [supabase.com](https://supabase.com) üzerinden yeni proje oluştur
2. **SQL Editor** → **New Query** → `supabase/schema.sql` içeriğini yapıştır ve çalıştır
3. **Authentication** → **Providers** → **Google** aktif et (opsiyonel)
4. **Authentication** → **URL Configuration** → Site URL: `http://localhost:3000`
5. Redirect URLs'e ekle: `http://localhost:3000/auth/callback`

### 2. Environment Variables
`.env.local` dosyası oluştur:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Bağımlılıkları Kur ve Çalıştır
```bash
npm install
npm run dev
```

### 4. Vercel Deploy
Vercel dashboard → **Settings** → **Environment Variables** kısmına `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerlerini ekle, ardından deploy et.

Production için Supabase'de **Authentication → URL Configuration** bölümüne Vercel domain'ini de ekle:
```
https://your-app.vercel.app/auth/callback
```

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database & Auth:** Supabase (PostgreSQL + RLS + Realtime)
- **Styling:** Tailwind CSS
- **Drag & Drop:** @dnd-kit/core, @dnd-kit/sortable
- **Language:** TypeScript
