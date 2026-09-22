import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Neeti Vivaad | Practise Real Policy Decisions',
  description: 'Explore realistic policy scenarios, consider different perspectives and practise making thoughtful decisions with Neeti Vivaad.',
  openGraph: {
    title: 'Neeti Vivaad | Practise Real Policy Decisions | Neeti Saarthi',
    description: 'Explore realistic policy scenarios, consider different perspectives and practise making thoughtful decisions with Neeti Vivaad.',
    url: '/debate',
  },
};

export default function DebateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
