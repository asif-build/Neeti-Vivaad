import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthGuard } from './components/AuthGuard';
import { NeetiSaarthiBuddy } from './components/NeetiSaarthiBuddy';

import { LanguageProvider } from './context/LanguageContext';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  variable: '--font-display',
  weight: ['500', '600', '700']
});

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800']
});

const mono = JetBrains_Mono({ 
  subsets: ['latin'], 
  variable: '--font-mono',
  weight: ['500', '700']
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neetisaarthi.gov.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Neeti Saarthi | Learn, Grow & Practise Better Decisions',
    template: '%s | Neeti Saarthi'
  },
  description: 'Neeti Saarthi helps public officials understand their skills, discover relevant learning opportunities and practise real-world decisions.',
  applicationName: 'Neeti Saarthi',
  authors: [{ name: 'Neeti Saarthi Team' }],
  creator: 'Neeti Saarthi',
  publisher: 'Neeti Saarthi',
  keywords: ['Neeti Saarthi', 'Civil Services', 'Skill Intelligence', 'Policy Decision Simulation', 'Neeti Vivaad', 'iGOT Karmayogi', 'MoSPI', 'Official Statistics'],
  icons: {
    icon: '/favicon.ico',
    apple: '/images/neeti_tree_emblem_dark.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Neeti Saarthi',
    title: 'Neeti Saarthi | Learn, Grow & Practise Better Decisions',
    description: 'Neeti Saarthi helps public officials understand their skills, discover relevant learning opportunities and practise real-world decisions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Neeti Saarthi — Learn, Grow & Practise Better Decisions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neeti Saarthi | Learn, Grow & Practise Better Decisions',
    description: 'Neeti Saarthi helps public officials understand their skills, discover relevant learning opportunities and practise real-world decisions.',
    images: ['/og-image.png'],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${mono.variable}`}>
      <body className="bg-[#070d18] text-[#111111] font-sans antialiased min-h-screen py-2 sm:py-5 px-1.5 sm:px-3 md:px-5 flex flex-col items-center justify-start selection:bg-[#F2A900] selection:text-[#111111]">
        <AuthGuard>
          <LanguageProvider>
            {/* Global Stage Container */}
            <div className="w-full max-w-[1440px] rounded-[24px] sm:rounded-[32px] md:rounded-[36px] border-2 border-[#111111] overflow-hidden bg-[#F8F7F2] shadow-2xl relative flex flex-col min-h-[95vh]">
              <Navbar />
              <main className="flex-1 w-full relative">
                {children}
              </main>
              <Footer />
            </div>
            {/* Neeti Saarthi Buddy Platform Guide */}
            <NeetiSaarthiBuddy />
          </LanguageProvider>
        </AuthGuard>
      </body>
    </html>
  );
}
