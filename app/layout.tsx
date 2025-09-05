import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Scan&Check",
  description: "Gluten & Lactosa — Demo",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" }
  },
  themeColor: "#f4b400"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Scan&Check" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* Splash screens iOS */}
        <link rel="apple-touch-startup-image" href="/splash/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />

        {/* Color barra del navegador */}
        <meta name="theme-color" content="#f4b400" />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-foreground`}>
        {/* Header superior con el logo SIN fondo/círculo */}
        <header className="w-full bg-brand-500 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            {/* Logo transparente sobre el fondo existente */}
            <Image
              src="/logo-transparent.png"
              alt="Scan&Check"
              width={32}
              height={32}
              priority
            />
            <div className="flex flex-col leading-tight">
              <h1 className="text-lg font-bold text-gray-900">Scan&Check</h1>
              <p className="text-sm text-gray-800">Gluten & Lactosa — Foto única (OCR local)</p>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
