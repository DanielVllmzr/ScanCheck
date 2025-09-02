import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan&Check — Gluten/Lactosa",
  description: "Escaneá etiquetas y detectá gluten/lactosa en tiempo real",
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
  themeColor: "#a16207"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
