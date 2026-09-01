import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OLAK (اولاک) - Local Mobility & Parcel Delivery | Turbat Balochistan",
  description: "Turbat’s premier on-demand local mobility and ride-sharing platform. Book verified Bike, Rickshaw, Car rides or send parcels across Turbat, Gwadar, Panjgur, and Balochistan.",
  keywords: ["OLAK", "Turbat Ride", "Turbat Taxi", "Balochistan Mobility", "Olak Delivery", "Turbat to Gwadar"],
  icons: {
    icon: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} antialiased bg-white text-slate-900 min-h-screen selection:bg-emerald-500 selection:text-white`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
