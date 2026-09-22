import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Your Neeti Saarthi Account',
  description: 'Create your official account on Neeti Saarthi to discover relevant courses, analyze competency gaps, and practise real decisions.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
