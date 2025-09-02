# Scan&Check — Gluten/Lactosa (iPhone-ready)

App Next.js + Tailwind con cámara + Vision API (opcional) para analizar etiquetas y detectar **gluten**, **lactosa**, origen del gluten y **contaminación cruzada**, con **score 1–10**, Pros/Contras y actualizaciones en vivo.

## 🚀 Correr local
```bash
pnpm i # o npm i / yarn
pnpm dev # http://localhost:3000
```
> Safari iOS requiere **HTTPS** para cámara. Probalo local con `ngrok` o desplegá en Vercel.

## 🔑 Vision (opcional)
1. Crear clave `OPENAI_API_KEY`.
2. Agregarla al entorno:
   - Local: crear `.env.local` con `OPENAI_API_KEY=...`
   - Vercel: Project → Settings → Environment Variables.
3. La API `/api/analyze` usará `gpt-4o-mini`. Sin clave, la app usa heurísticas locales (demo).

## 📱 iPhone
- Serví la app por **HTTPS** (Vercel lo hace por defecto).
- `playsInline` y `muted` ya están configurados para iOS.
- En iOS 17+, Safari permite `getUserMedia` en HTTPS.

## 🛠 Tech
- Next.js 14 (App Router)
- TailwindCSS
- Framer Motion
- OpenAI SDK (Vision) — opcional

## 🧩 Estructura
```
app/
  api/analyze/route.ts   # Vision + fallback local
  page.tsx               # Carga el componente
components/
  ScanCheck.tsx          # UI cámara + análisis en vivo
lib/
  analyze.ts             # Heurísticas locales
public/
  manifest.json
```

## ☁️ Deploy (Vercel)
1. Sube este repo a **GitHub**.
2. En **Vercel**, importa el repo → Framework: *Next.js*.
3. Agregá `OPENAI_API_KEY` en Environment Variables (opcional).
4. Deploy. Abrí la URL en el iPhone y permití la cámara.

## 🤝 Notas
- El score es orientativo y no reemplaza consejo médico.
- Ajustá los detectores en `lib/analyze.ts` para nuevos idiomas/regiones.
