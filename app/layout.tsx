import type { Metadata } from "next";
import { DM_Mono, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ControlCajas",
  description: "Sistema de gestión de cajas",
  icons: {
    icon: [
      {
        url: "/icons/maskable_icon_x48.png",
        sizes: "48x48",
        type: "image/png",
      },
    ],
    shortcut: "/icons/maskable_icon_x48.png",
    apple: "/icons/maskable_icon_x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${dmMono.variable}`}>
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
