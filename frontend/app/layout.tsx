import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthGuard } from './components/AuthGuard';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Neeti Saarthi | AI Skill Intelligence, e-Recruitment & Policy Debate Platform',
  description: 'AI-powered Skill Intelligence, e-Recruitment & Decision Training Platform for India\'s Official Statistical System (MoSPI SIH26101).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-white text-[#171717] font-sans antialiased min-h-screen flex flex-col selection:bg-[#3ecf8e] selection:text-[#171717]">
        <AuthGuard>
          <Navbar />
          <main className="flex-1 pt-12">
            {children}
          </main>
          <Footer />
        </AuthGuard>
      </body>
    </html>
  );
}
