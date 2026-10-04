import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
  interactiveWidget: 'resizes-content',
};

export const metadata: Metadata = {
  title: 'Giantigravity | Google AI IDE',
  description: 'Sviluppa sul tuo repository GitHub da smartphone con Google Gemini',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Giantigravity',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark h-full bg-neutral-950">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-[100dvh] w-full overflow-hidden bg-neutral-950 text-neutral-100 selection:bg-cyan-500 selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
