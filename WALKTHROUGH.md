# Walkthrough — AI Chatbot (Next.js)

Dokumen ini menjelaskan instalasi, struktur folder, teknologi, alur data, debugging, dan deploy. Akses file ini secara lokal di root proyek: `WALKTHROUGH.md`.

---

## 1. Ringkasan aplikasi

Aplikasi ini adalah **chatbot web** berbasis **Next.js (App Router)** dengan UI React: percakapan multi-thread (sidebar), **streaming** teks dari model AI, dan styling **Tailwind CSS v4**. Browser **tidak** memanggil API model secara langsung; browser memanggil **Route Handler** `POST /api/chat`, lalu server memanggil **OpenRouter** (`https://openrouter.ai/api/v1/chat/completions`).

> **Catatan:** Di UI ada teks “Gemini” / “gemini-2.0-flash”, tetapi backend chat memakai **OpenRouter** dengan model **`openai/gpt-oss-120b:free`** (lihat `src/app/api/chat/route.ts`). Paket `@google/genai` di `package.json` **tidak** dipakai oleh route chat saat ini—berguna hanya jika Anda mengintegrasikan Google GenAI secara terpisah.

---

## 2. Bahasa & teknologi

| Lapisan | Bahasa / teknologi |
|--------|-------------------|
| **Bahasa utama** | **TypeScript** (`.ts`, `.tsx`) |
| **UI** | **React 19** + **JSX/TSX** |
| **Framework** | **Next.js 16** (App Router: `src/app/`) |
| **Styling** | **Tailwind CSS v4** (`@import "tailwindcss"` di `globals.css`) + CSS kustom |
| **Konfigurasi** | **JSON**, **MJS** (ESLint, PostCSS), **TS** (`next.config.ts`) |
| **Runtime** | **Node.js** (`next dev` / `next build` / `next start`) |

Tidak ada backend bahasa lain (Python/Java terpisah)—semua dalam satu aplikasi Next.js.

---

## 3. Struktur folder

```
ai-chatbot/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # HTML shell, font Geist, metadata
│   │   ├── page.tsx            # Halaman utama: state percakapan, fetch streaming
│   │   ├── globals.css         # Tailwind + tema + gaya markdown (.prose-chat)
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts    # POST: proxy OpenRouter, stream plain text
│   ├── components/
│   │   ├── Sidebar.tsx         # Daftar percakapan, baru, hapus
│   │   ├── ChatInput.tsx       # Input, Enter untuk kirim
│   │   └── MessageBubble.tsx   # Tampilan pesan user/assistant
│   └── types/
│       └── index.ts            # Message, Conversation
├── public/                     # Asset statis (SVG, dll.)
├── package.json
├── package-lock.json
├── tsconfig.json               # Alias: @/* → ./src/*
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── README.md
├── WALKTHROUGH.md              # File ini
├── AGENTS.md / CLAUDE.md       # Aturan agen AI di Cursor
└── .gitignore
```

### Peta cepat: mau ubah apa?

| Kebutuhan | File utama |
|-----------|------------|
| Alur chat & streaming di client | `src/app/page.tsx` |
| Model, URL, header API | `src/app/api/chat/route.ts` |
| Daftar percakapan | `src/components/Sidebar.tsx` |
| Input pengguna | `src/components/ChatInput.tsx` |
| Tampilan bubble | `src/components/MessageBubble.tsx` |
| Tipe data pesan | `src/types/index.ts` |
| Tema, markdown, scrollbar | `src/app/globals.css` |
| Judul tab & deskripsi SEO | `src/app/layout.tsx` |

### Debugging: mulai dari mana?

| Gejala | Yang dicek |
|--------|-------------|
| Error 500 tentang key | `OPENROUTER_API_KEY` di `.env.local` |
| Gagal fetch / API | Log server, status HTTP OpenRouter, isi `error` JSON dari route |
| Stream putus / teks aneh | Parser `data: ` di `route.ts` + `reader.read()` di `page.tsx` |
| Data hilang saat refresh | State hanya di React—perlu persistensi (localStorage/DB) jika diinginkan |

---

## 4. Prasyarat

1. **Node.js** LTS (misalnya 20.x).
2. **npm** (atau `pnpm` / `yarn` / `bun`).
3. Akun dan **API key** [OpenRouter](https://openrouter.ai).

---

## 5. Instalasi (langkah demi langkah)

1. Buka terminal di folder proyek, contoh: `c:\Project\ai-chatbot`.

2. Instal dependency:

   ```bash
   npm install
   ```

3. Buat file **`.env.local`** di root (sejajar `package.json`):

   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

   Jangan commit key ke git (biasanya `.env.local` sudah diabaikan `.gitignore`).

4. Jalankan development server:

   ```bash
   npm run dev
   ```

5. Buka browser: [http://localhost:3000](http://localhost:3000).

---

## 6. Perintah npm

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Mode pengembangan + hot reload |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan build (setelah `npm run build`) |
| `npm run lint` | ESLint |

**Sebelum deploy:** jalankan `npm run lint` dan `npm run build` untuk memastikan tidak ada error.

---

## 7. Alur data (ringkas)

1. Pengguna mengetik → `ChatInput` memanggil `onSend` di `page.tsx`.
2. `page.tsx` mengirim `POST /api/chat` dengan body `{ messages: [...] }` (role + content).
3. `route.ts` memakai `OPENROUTER_API_KEY`, memanggil OpenRouter dengan `stream: true`.
4. Server mengonversi chunk SSE OpenRouter menjadi **stream teks biasa** ke client.
5. `page.tsx` membaca stream, mengakumulasi string, memperbarui pesan assistant terakhir.

**Mengganti model:** edit field `model` pada `JSON.stringify` di `src/app/api/chat/route.ts`.

---

## 8. Deploy

### Vercel (umum untuk Next.js)

1. Push kode ke Git (GitHub/GitLab/Bitbucket).
2. Di [vercel.com](https://vercel.com), **Import** repository.
3. Preset: Next.js; root folder sesuai struktur repo Anda.
4. **Environment Variables:** tambahkan `OPENROUTER_API_KEY` (Production, dan Preview jika perlu).
5. Deploy; uji kirim pesan di URL produksi.

**Keamanan:** jangan set `OPENROUTER_API_KEY` sebagai `NEXT_PUBLIC_*` dan jangan expose key di kode client.

### VPS / Docker (ringkas)

- Jalankan `npm run build` lalu `npm run start` dengan variabel lingkungan yang sama.
- Letakkan reverse proxy (misalnya nginx) ke port aplikasi (default **3000**).

---

## 9. Referensi eksternal

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenRouter API](https://openrouter.ai/docs)

Versi Next.js di proyek ini dapat memiliki perbedaan API dari dokumentasi generik—perhatikan `AGENTS.md` di repo untuk pengingat versi.
