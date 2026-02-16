import type { Metadata, Viewport } from "next"; // Import Viewport
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 1. SETUP METADATA PWA
export const metadata: Metadata = {
  title: "Zenith Tracker",
  description: "Bangun kebiasaan baik, raih keberkahan.",
  manifest: "/manifest.json", // Link ke manifest
  icons: {
    apple: "/icons/icon-192.png", // Icon untuk iPhone
  },
};

// 2. SETUP VIEWPORT (Agar tidak bisa di-zoom & warna status bar menyatu)
export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah zoom cubit (rasa native app)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}