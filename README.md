# 🎫 TiketKonser

Platform pembelian tiket konser online dengan fitur e-ticket berbasis QR Code.

## 🌟 Fitur Utama

### Untuk Pengguna (User)
- 🎵 Jelajahi konser dengan filter kategori & pencarian
- 🎟️ Beli tiket dengan berbagai kategori (VIP, Regular, dll)
- 📱 E-ticket dengan QR Code untuk validasi masuk
- 👤 Profil dengan riwayat pembelian tiket
- ⏰ Countdown timer untuk konser mendatang

### Untuk Admin
- 📊 Dashboard statistik (konser, pesanan, pendapatan)
- 🎤 Kelola konser (tambah, edit, hapus)
- 🏷️ Kelola tipe tiket per konser
- 🖼️ Upload gambar konser
- 📋 Lihat semua pesanan
- 📷 Validasi tiket dengan scan QR Code di venue

## 👥 User Roles

| Role | Deskripsi |
|------|-----------|
| **User** | Pengguna umum - dapat menjelajahi konser, membeli tiket, dan melihat e-ticket |
| **Admin** | Administrator - akses penuh ke dashboard, kelola konser & tiket, validasi tiket |

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud
- **Database**: PostgreSQL dengan RLS
- **QR Code**: qrcode.react, html5-qrcode

## 🚀 Cara Menjalankan

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## 📁 Struktur Folder

```
src/
├── components/          # Komponen UI
│   ├── admin/          # Komponen khusus admin
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── pages/              # Halaman aplikasi
│   └── admin/          # Halaman admin dashboard
├── integrations/       # Integrasi external (Supabase)
├── data/               # Data statis
└── types/              # TypeScript types
```

## 🔐 Setup Admin

Untuk memberikan role admin ke user:

```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_ANDA', 'admin');
```

## 📱 Halaman Utama

| Route | Deskripsi |
|-------|-----------|
| `/` | Landing page |
| `/concerts` | Daftar semua konser |
| `/concerts/:id` | Detail konser |
| `/checkout/:id` | Halaman checkout |
| `/order-success` | Konfirmasi pesanan |
| `/auth` | Login & Register |
| `/profile` | Profil & riwayat tiket |
| `/admin` | Dashboard admin |
| `/admin/concerts` | Kelola konser |
| `/admin/orders` | Daftar pesanan |
| `/admin/tickets` | Kelola tiket |
| `/admin/validation` | Validasi QR tiket |

## 🔗 Links

- **Preview**: [TiketKonser App](https://luxetix.lovable.app)
- **Documentation**: [TODO.md](./TODO.md)

---

*Built with ❤️ using Lovable*
