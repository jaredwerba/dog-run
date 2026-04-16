import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DogRun — Find your run buddy in Boston",
  description: "Match dog owners with runners at Castle Island and across Boston.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="min-h-full flex flex-col antialiased">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
