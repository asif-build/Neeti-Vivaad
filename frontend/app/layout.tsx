import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Neeti Vivaad | AI Skill Intelligence & Policy Debate Platform',
  description: 'AI-powered Skill Intelligence & Learning Platform for officials in India\'s Official Statistical System (MoSPI SIH26101).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} dark`}>
      <body className="bg-zinc-950 text-zinc-100 font-sans antialiased min-h-screen flex flex-col selection:bg-cyan-500 selection:text-zinc-950">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
