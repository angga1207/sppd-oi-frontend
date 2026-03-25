import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { APP_NAME, APP_DESCRIPTION, APP_FULL_NAME } from "@/lib/version";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#e84393",
};

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: "Diskominfo Kabupaten Ogan Ilir" }],
  generator: "Next.js",
  keywords: [
    "e-SPD",
    "Surat Perjalanan Dinas",
    "Surat Tugas",
    "Ogan Ilir",
    "Pemerintah Kabupaten",
    "Sistem Elektronik",
  ],
  icons: {
    icon: "/logo-oi.png",
    apple: "/logo-oi.png",
    shortcut: "/logo-oi.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/logo-oi.png",
        width: 512,
        height: 512,
        alt: APP_FULL_NAME,
      },
    ],
  },
  robots: {
    index: false,
    follow: false,
  },
  other: {
    "msapplication-TileColor": "#e84393",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
