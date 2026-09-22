import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, FileText, ArrowRight, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Neeti Saarthi',
  description: 'Understand how Neeti Saarthi collects, processes, and protects your information, uploaded documents, and learning data.',
  openGraph: {
    title: 'Privacy Policy | Neeti Saarthi',
    description: 'Understand how Neeti Saarthi collects, processes, and protects your information, uploaded documents, and learning data.',
    url: '/privacy-policy',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Neeti Saarthi',
    description: 'Neeti Saarthi Privacy Policy & Data Practices.',
  }
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 2026";

  return (
    <div className="w-full bg-[#F8F7F2] text-[#111111] py-10 sm:py-16 px-4 sm:px-8 font-sans">
      <div className="max-w-[960px] mx-auto space-y-10">
        
        {/* Header */}
        <div className="space-y-4 border-b-2 border-[#111111] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FEF3C7] border border-[#111111] shadow-brutal-sm">
            <Shield className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>TRANSPARENCY &amp; TRUST</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight uppercase">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-[#4B5563]">
            Last updated: {lastUpdated} &bull; Neeti Saarthi Learning &amp; Decision-Practice Platform
          </p>
        </div>

        {/* Legal Body: 16 Structured Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-[#374151] leading-relaxed">

          {/* 1. Introduction */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              1. Introduction
            </h2>
            <p>
              Welcome to <strong>Neeti Saarthi</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;the platform&quot;). Neeti Saarthi is an educational, skill intelligence, and policy decision-practice platform developed to assist public officials in understanding their competencies, discovering relevant learning opportunities, and practicing real-world administrative decisions.
            </p>
            <p>
              This Privacy Policy explains clearly and transparently what information we collect, how that information is used, how automated processing and AI tools are utilized, and what controls you maintain over your data.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="space-y-3 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              2. Information We Collect
            </h2>
            <p>We collect only the information necessary to provide and operate the platform&apos;s features:</p>
            <ul className="list-disc pl-5 space-y-1.5 font-sans">
              <li>
                <strong>Account Credentials:</strong> Name, official email address, mobile number (optional), and securely hashed passwords (passwords are stored using irreversible cryptographic hashes and are never stored in plaintext).
              </li>
              <li>
                <strong>Profile &amp; Professional Background:</strong> Department, designation, organisation, self-reported experience, education, and user-confirmed competency proficiencies.
              </li>
              <li>
                <strong>Uploaded Documents:</strong> Resumes or CV documents uploaded during onboarding, and administrative reference guidelines/documents uploaded for Knowledge Checks or Neeti Vivaad scenario synthesis.
              </li>
              <li>
                <strong>Learning &amp; Activity Data:</strong> Course preview/completion status, Knowledge Check answers, quiz scores, simulated decision selections, reasoning notes submitted during Neeti Vivaad, and feedback records.
              </li>
              <li>
                <strong>Technical &amp; Security Logs:</strong> IP address, browser user-agent header, request timestamps, and security audit logs used exclusively to detect abusive behavior, enforce rate limits, and maintain service reliability.
              </li>
              <li>
                <strong>Support &amp; Feedback:</strong> Messages, email addresses, and categories submitted through the support form or review submission feature.
              </li>
            </ul>
          </section>

          {/* 3. How We Use Information */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              3. How We Use Information
            </h2>
            <p>We use the collected information for the following specific purposes:</p>
            <ul className="list-disc pl-5 space-y-1 font-sans">
              <li>To authenticate your identity and safeguard your account against unauthorized access.</li>
              <li>To compute baseline competency ratings and generate personalized learning recommendations.</li>
              <li>To extract learning materials and formulate grounded knowledge check questions.</li>
              <li>To simulate stakeholder debate perspectives and evaluate policy decision trade-offs.</li>
              <li>To prevent bot spam, automated scraping, credential stuffing, and service abuse.</li>
              <li>To respond to your questions, feedback, and technical support requests.</li>
            </ul>
          </section>

          {/* 4. AI and Automated Processing */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              4. AI and Automated Processing
            </h2>
            <p>
              Neeti Saarthi leverages artificial intelligence (including Google Gemini API and structured local extraction engines) to assist learners:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-sans">
              <li>
                <strong>Resume Skill Extraction:</strong> Extracting skills, education, and experience from resumes to populate your competency profile draft for your review and confirmation.
              </li>
              <li>
                <strong>Knowledge Check Generation:</strong> Synthesizing questions, answer choices, and page citations strictly from documents uploaded by users.
              </li>
              <li>
                <strong>Neeti Vivaad Simulations:</strong> Simulating differing stakeholder viewpoints (such as state representatives, data quality regulators, and field officers) and evaluating decision reasoning against standard policy criteria.
              </li>
              <li>
                <strong>Platform Buddy:</strong> Helping users navigate features and understand platform recommendations.
              </li>
            </ul>
            <p className="text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
              <strong>Notice on AI Limitations:</strong> AI-generated content is intended solely for educational, exploratory, and decision-practice purposes. While designed to ground outputs in source materials, automated models may occasionally produce errors. Outputs should never be treated as formal government policy rulings or legal counsel.
            </p>
          </section>

          {/* 5. Uploaded Documents */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              5. Uploaded Documents
            </h2>
            <p>
              Documents uploaded to Neeti Saarthi (such as resumes, guidelines, or manuals) are isolated and accessible only to your authenticated account or platform administrators. Files undergo format validation and size checks. <strong>Users must never upload classified, confidential, or sensitive state secrets to the platform.</strong>
            </p>
          </section>

          {/* 6. Learning and Activity Data */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              6. Learning and Activity Data
            </h2>
            <p>
              Your assessment scores, quiz submissions, and simulation results are stored to reflect your personal competency progress over time. Aggregated, anonymized statistics (such as average competency levels across domains) may be viewed by platform administrators to identify systemic learning needs. Individual answers and simulation turns are not publicly displayed.
            </p>
          </section>

          {/* 7. Authentication and Security */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              7. Authentication and Security
            </h2>
            <p>
              We implement industry-standard security safeguards:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-sans">
              <li>Cryptographic password hashing using standard PBKDF2/SHA-256 algorithms.</li>
              <li>JSON Web Tokens (JWT) for secure, expiring session authentication.</li>
              <li>Single-use expiring email verification tokens and password reset tokens.</li>
              <li>Transport Layer Security (TLS/HTTPS) encryption for data in transit.</li>
              <li>Security headers protecting against clickjacking, cross-site scripting (XSS), and MIME sniffing.</li>
            </ul>
          </section>

          {/* 8. CAPTCHA and Abuse Prevention */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              8. CAPTCHA and Abuse Prevention
            </h2>
            <p>
              To protect Neeti Saarthi against automated bots, credential stuffing, and malicious scraping, we utilize <strong>Google reCAPTCHA v3</strong>.
            </p>
            <p>
              reCAPTCHA v3 works frictionless in the background by analyzing interaction risk signals to distinguish human learners from automated bots. The use of reCAPTCHA is subject to Google&apos;s Privacy Policy and Terms of Service.
            </p>
          </section>

          {/* 9. Third-Party Services */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              9. Third-Party Services
            </h2>
            <p>
              Neeti Saarthi integrates with selected third-party service providers to deliver platform capabilities:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-sans">
              <li><strong>Google reCAPTCHA v3:</strong> Risk scoring and bot prevention.</li>
              <li><strong>Google Gemini API:</strong> Natural language analysis for skills extraction and simulation logic.</li>
              <li><strong>Email Delivery (SMTP):</strong> Transactional email dispatch (verification, password resets, support notices).</li>
              <li><strong>iGOT Karmayogi:</strong> Public course catalog references and deep links (we do not share your private passwords or personal account keys with external course portals).</li>
            </ul>
            <p>
              We do not sell, rent, or trade your personal information to commercial advertising networks.
            </p>
          </section>

          {/* 10. Data Retention */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              10. Data Retention
            </h2>
            <p>
              Your account details, competency history, and uploaded materials are retained for the duration of your active participation on the platform to maintain your learning record. Temporary tokens (such as password reset requests and email verifications) expire automatically within their designated expiration windows (1 to 24 hours).
            </p>
          </section>

          {/* 11. Data Security */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              11. Data Security
            </h2>
            <p>
              We maintain reasonable technical and organizational measures to prevent unauthorized data access, destruction, or disclosure. However, no internet transmission or electronic storage method can guarantee absolute security. Users are responsible for safeguarding their login credentials and promptly notifying us of any suspected breach.
            </p>
          </section>

          {/* 12. Your Choices */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              12. Your Choices
            </h2>
            <p>
              You maintain full control over the competencies displayed on your profile. During onboarding and anytime in your profile dashboard, you may edit, add, or remove identified skills and adjust your learning goals.
            </p>
          </section>

          {/* 13. Account and Data Deletion */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              13. Account and Data Deletion
            </h2>
            <p>
              You have the right to request deletion of your account and associated personal data at any time.
            </p>
            <div className="p-4 rounded-xl bg-[#F8F7F2] border-2 border-[#111111] space-y-2 font-mono text-xs">
              <p className="font-bold text-[#111111]">How to request data deletion:</p>
              <p>
                To request account or data deletion, contact us directly at{' '}
                <a href="mailto:neetisaarthi@gmail.com" className="font-bold text-[#0F766E] underline">neetisaarthi@gmail.com</a>{' '}
                with the subject line <strong>&quot;Data Deletion Request&quot;</strong> from your registered email address.
              </p>
              <p className="text-[#4B5563]">
                Upon receiving and verifying your request, we will remove your account profile, uploaded resume documents, personal assessment history, and simulation transcripts from our database, while preserving any public shared course catalog data.
              </p>
            </div>
          </section>

          {/* 14. Children's Privacy */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              14. Children&apos;s Privacy
            </h2>
            <p>
              Neeti Saarthi is designed for public officials, administrators, and adult professional learners. We do not knowingly collect personal information from children under the age of 18.
            </p>
          </section>

          {/* 15. Changes to This Policy */}
          <section className="space-y-2 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              15. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect evolving platform capabilities, security standards, or regulatory guidelines. Updates will be posted on this page with a revised &quot;Last updated&quot; date.
            </p>
          </section>

          {/* 16. Contact Us */}
          <section className="space-y-3 card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] rounded-2xl shadow-brutal">
            <h2 className="text-base sm:text-lg font-display font-bold uppercase text-[#111111]">
              16. Contact Us
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact us at:
            </p>
            <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#111111] flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-[#111111]">Neeti Saarthi Support Team</p>
                <p className="font-mono text-xs text-[#0F766E]">neetisaarthi@gmail.com</p>
              </div>
              <a
                href="mailto:neetisaarthi@gmail.com"
                className="btn-brutal-primary text-xs !py-2 !px-4"
              >
                Send Email
              </a>
            </div>
          </section>

        </div>

        {/* Back Link */}
        <div className="pt-4 border-t-2 border-[#111111] flex items-center justify-between">
          <Link href="/" className="text-xs font-mono font-bold text-[#111111] hover:text-[#0F766E] underline">
            &larr; Return to Home
          </Link>
          <Link href="/terms" className="text-xs font-mono font-bold text-[#111111] hover:text-[#0F766E] underline">
            Read Terms of Use &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
