import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthGuard } from './components/AuthGuard';
import { NeetiSaarthiBuddy } from './components/NeetiSaarthiBuddy';

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

export const metadata: Metadata = {
  title: 'Neeti Saarthi | Your Skills. Your Growth. Your Next Step.',
  description: 'AI-powered Skill Intelligence & Learning Platform for India\'s Public-Sector Statistical System (MoSPI SIH26101).',
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
        </AuthGuard>
      </body>
    </html>
  );
}
