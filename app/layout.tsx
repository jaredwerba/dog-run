import type { Metadata } from "next";
import { Inter, Bevan, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bevan = Bevan({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-bevan",
});
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.rundog.boston";
const TITLE = "Go Dogs Boston 🎾 — Runners and high-energy dogs, matched";
const DESCRIPTION =
  "Go Dogs Boston 🎾 matches local runners with high-energy dogs and their owners. Runners get a training partner. Dogs get their miles.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    siteName: "Go Dogs Boston",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${inter.variable} ${bevan.variable} ${publicSans.variable} ${plexMono.variable}`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <NavBar />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
