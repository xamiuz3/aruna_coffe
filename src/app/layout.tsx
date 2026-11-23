import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Aruna Cafe Samarinda (@arunacafe.smd) - Coffee & Kitchen",
  description: "Temukan rasa favoritmu di Aruna Cafe Samarinda (@arunacafe.smd). Self-order dari meja dengan pembayaran QRIS BRI Merchant & Kasir.",
  icons: {
    icon: [
      { url: '/aruna-logo.jpg', sizes: 'any' },
      { url: '/aruna-logo.jpg', type: 'image/jpeg' },
    ],
    shortcut: '/aruna-logo.jpg',
    apple: '/aruna-logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#ede7de] text-[#241e1b]">
        {children}
      </body>
    </html>
  );
}
