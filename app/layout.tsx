import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es">
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
