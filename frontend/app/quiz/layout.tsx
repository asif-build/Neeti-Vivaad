import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Check',
  description: "Test what you've learned with practical knowledge checks and learning activities.",
  openGraph: {
    title: 'Knowledge Check | Neeti Saarthi',
    description: "Test what you've learned with practical knowledge checks and learning activities.",
    url: '/quiz',
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
