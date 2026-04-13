import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const serif = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6b7c5e",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://weatherwear-blush.vercel.app"),
  title: {
    default: "WeatherWear — What to actually wear, based on how it actually feels",
    template: "%s | WeatherWear",
  },
  description: "AI-powered outfit recommendations based on hourly weather — sun feel, shade feel, wind chill, UV, and rain chance. Plus a REST API for developers.",
  manifest: "/manifest.json",
  openGraph: {
    title: "WeatherWear — What to actually wear, based on how it actually feels",
    description: "AI-powered outfit recommendations based on hourly weather — sun feel, shade feel, wind chill, UV, and rain chance.",
    siteName: "WeatherWear",
    type: "website",
    url: "https://weatherwear-blush.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "WeatherWear",
    description: "What to actually wear, based on how it actually feels.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WeatherWear",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-sans)] bg-background">
        {children}
      </body>
    </html>
  );
}
