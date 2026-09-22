import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, AlertTriangle, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Use | Neeti Saarthi',
  description: 'Terms of Use and Acceptable Use Policy for the Neeti Saarthi learning and decision-practice platform.',
  openGraph: {
    title: 'Terms of Use | Neeti Saarthi',
    description: 'Terms of Use and Acceptable Use Policy for the Neeti Saarthi learning and decision-practice platform.',
    url: '/terms',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Use | Neeti Saarthi',
    description: 'Neeti Saarthi Terms of Use and Acceptable Use Guidelines.',
  }
};

export default function TermsPage() {
  const lastUpdated = "September 2026";

  return (
    <div className="w-full bg-[#F8F7F2] text-[#111111] py-10 sm:py-16 px-4 sm:px-8 font-sans">
      <div className="max-w-[960px] mx-auto space-y-10">
        
        {/* Header */}
        <div className="space-y-4 border-b-2 border-[#111111] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FEF3C7] border border-[#111111] shadow-brutal-sm">
            <FileText className="w-3.5 h-3.5 text-[#D97706]" />
            <span>TERMS &amp; ACCEPTABLE USE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight uppercase">
            Terms of Use
          </h1>
          <p className="text-xs font-mono text-[#4B5563]">
            Last updated: {lastUpdated} &bull; Neeti Saarthi Learning &amp; Decision-Practice Platform
          </p>
        </div>

        {/* AI Disclaimer Highlight */}
        <div className="p-6 rounded-2xl bg-[#FEF3C7] border-2 border-[#111111] shadow-brutal space-y-3">
          <div className="flex items-center gap-2 text-sm font-display font-extrabold uppercase text-[#111111]">
            <AlertTriangle className="w-5 h-5 text-[#D97706]" />
            <span>Official AI Disclaimer</span>
          </div>
          <p className="text-xs sm:text-sm text-[#111111] leading-relaxed font-medium">
            &quot;Neeti Saarthi uses AI to help explain information, generate learning activities and simulate different perspectives. AI-generated content may contain mistakes. For real-world decisions, users should refer to the relevant official sources and applicable rules.&quot;
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-[#374151] leading-relaxed">
          
          {/* 1. Educational and Decision-Practice Purpose */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              1. Educational &amp; Decision-Practice Purpose
            </h2>
            <p>
              Neeti Saarthi is designed to provide public officials and administrative learners with a simulated environment to understand their skills, explore curated learning opportunities, test their knowledge, and practise thoughtful decision-making through policy scenarios.
            </p>
            <p>
              The platform and its simulations do <strong>not</strong> constitute binding administrative rulings, formal governmental orders, legal opinions, or authoritative civil service evaluations.
            </p>
          </section>

          {/* 2. Account Responsibility */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              2. Account Responsibility
            </h2>
            <p>
              When creating an account, you agree to provide truthful and accurate information regarding your name and official email address. You are solely responsible for maintaining the confidentiality of your credentials and for all actions that occur under your account.
            </p>
          </section>

          {/* 3. Acceptable Use & Prohibited Conduct */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              3. Acceptable Use &amp; Prohibited Conduct
            </h2>
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <ul className="list-disc pl-5 space-y-1 font-sans">
              <li>Attempting to bypass, tamper with, or circumvent API rate limits, authentication controls, or bot protection mechanisms.</li>
              <li>Deploying automated scrapers, spiders, or extraction bots against platform endpoints without authorization.</li>
              <li>Uploading malicious files, executable scripts, or corrupted documents intended to exploit or disrupt platform infrastructure.</li>
              <li>Submitting fraudulent reviews, spam support messages, or bulk fake accounts.</li>
              <li>Using Neeti Saarthi to disseminate defamatory, obscene, harassing, or unlawful material.</li>
            </ul>
          </section>

          {/* 4. Uploaded Content Responsibility */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              4. Uploaded Content Responsibility
            </h2>
            <p>
              You represent that you have the right to upload any resumes or administrative reference documents submitted to Neeti Saarthi. 
            </p>
            <p className="text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-200">
              <strong>Strict Requirement:</strong> Users must NOT upload classified, confidential, restricted, or secret government documents to the platform. Upload only public manuals, open guidelines, or non-confidential career documents.
            </p>
          </section>

          {/* 5. External Course Links */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              5. External Course Portals
            </h2>
            <p>
              Neeti Saarthi references and links to public course curricula on platforms such as <strong>iGOT Karmayogi</strong>. We do not operate external platforms, and your interactions with external portals are governed by their respective terms of service and access policies.
            </p>
          </section>

          {/* 6. Service Availability & Changes */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              6. Service Availability &amp; Modifications
            </h2>
            <p>
              We continually refine and improve the platform. We reserve the right to modify, update, or temporarily suspend features, rate limits, or services without prior liability.
            </p>
          </section>

          {/* 7. Contact Information */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              7. Contact Information
            </h2>
            <p>
              For any questions regarding these Terms of Use, please reach out directly:
            </p>
            <p className="font-mono font-bold text-xs text-[#0F766E]">
              neetisaarthi@gmail.com
            </p>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="pt-4 border-t-2 border-[#111111] flex items-center justify-between">
          <Link href="/" className="text-xs font-mono font-bold text-[#111111] hover:text-[#0F766E] underline">
            &larr; Return to Home
          </Link>
          <Link href="/privacy-policy" className="text-xs font-mono font-bold text-[#111111] hover:text-[#0F766E] underline">
            Read Privacy Policy &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
