import type { Metadata } from "next";
import { Grenze_Gotisch, Almendra, Cinzel } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const grenzeGotisch = Grenze_Gotisch({
  variable: "--font-grenze-gotisch",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const almendra = Almendra({
  variable: "--font-almendra",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Herbalism Tool",
  description: "D&D Homebrew Herbalism System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${grenzeGotisch.variable} ${almendra.variable} ${cinzel.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
