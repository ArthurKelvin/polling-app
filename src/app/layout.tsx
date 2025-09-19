import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/provider";
import { Navigation } from "@/components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polling App - Create and Share Polls",
  description: "A modern polling application with QR code sharing, real-time results, and discussion features. Create polls, vote, and share with others.",
  keywords: ["polling", "polls", "voting", "surveys", "QR code", "real-time"],
  authors: [{ name: "Polling App Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  robots: "index, follow",
  openGraph: {
    title: "Polling App - Create and Share Polls",
    description: "A modern polling application with QR code sharing, real-time results, and discussion features.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polling App - Create and Share Polls",
    description: "A modern polling application with QR code sharing, real-time results, and discussion features.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50 text-gray-900`}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1" role="main">
              {children}
            </main>
            <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
              <div className="container mx-auto px-4 text-center text-sm text-gray-600">
                <p>&copy; 2025 Polling App. Built with Next.js and Supabase.</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
