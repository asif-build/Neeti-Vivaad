import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn',
  description: 'Discover learning opportunities and courses that help you build skills and grow professionally.',
  openGraph: {
    title: 'Learn | Neeti Saarthi',
    description: 'Discover learning opportunities and courses that help you build skills and grow professionally.',
    url: '/courses',
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
