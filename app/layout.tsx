import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google"; 
import "./globals.css";

// TAMBAHKAN 'variable' DI SINI
const fontSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"], 
  display: "swap",
  variable: "--font-plus-jakarta", // <-- PENTING: Nama variabel CSS
});

export const metadata: Metadata = {
  title: "Zenith Tracker",
  description: "Bangun kebiasaan baik, raih keberkahan.",
  manifest: "/manifest.json", 
  icons: {
    apple: "/icons/icon-192.png", 
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      {/* TAMBAHKAN variable ke className */}
      <body className={`${fontSans.className} ${fontSans.variable} bg-slate-950 text-slate-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}