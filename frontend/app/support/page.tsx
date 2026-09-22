import React from 'react';
import type { Metadata } from 'next';
import SupportClient from './SupportClient';

export const metadata: Metadata = {
  title: 'Support | Neeti Saarthi',
  description: 'Need help with Neeti Saarthi? We are here to help. Reach out to our team at neetisaarthi@gmail.com for technical issues, feedback, or suggestions.',
  openGraph: {
    title: 'Support | Neeti Saarthi',
    description: 'Need help with Neeti Saarthi? We are here to help. Contact neetisaarthi@gmail.com for technical issues, questions, or suggestions.',
    url: '/support',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support | Neeti Saarthi',
    description: 'Need help with Neeti Saarthi? Reach out to neetisaarthi@gmail.com.',
  }
};

export default function SupportPage() {
  return <SupportClient />;
}
