import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  UserCheck, BookOpen, CheckCircle2, MessageSquare, 
  Bot, ShieldCheck, ArrowRight, Sparkles, Target, Compass
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Neeti Saarthi | Learn, Grow & Practise',
  description: 'Neeti Saarthi is a learning and decision-practice platform designed to help public officials understand their strengths, discover relevant learning opportunities, build skills and practise real-world decisions.',
  openGraph: {
    title: 'About Neeti Saarthi | Learn, Grow & Practise',
    description: 'Neeti Saarthi is a learning and decision-practice platform designed to help public officials understand their strengths, discover relevant learning opportunities, build skills and practise real-world decisions.',
    url: '/about',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Neeti Saarthi | Learn, Grow & Practise',
    description: 'Neeti Saarthi is a learning and decision-practice platform designed to help public officials understand their strengths, discover relevant learning opportunities, build skills and practise real-world decisions.',
  }
};

export default function AboutPage() {
  const pillars = [
    {
      icon: UserCheck,
      title: 'My Profile',
      subtitle: 'Understand your skills and experience.',
      description: 'Upload your professional background or resume to automatically map your skills across civil service competency domains. Review, edit, and understand where your core strengths lie.',
      href: '/dashboard',
      actionText: 'View Profile Experience',
      color: 'border-[#0F766E]'
    },
    {
      icon: BookOpen,
      title: 'Learn',
      subtitle: 'Discover relevant learning opportunities.',
      description: 'Explore high-quality courses and learning modules curated to address specific competency gaps, including official iGOT Karmayogi curriculum integrations and statistical guidelines.',
      href: '/courses',
      actionText: 'Explore Courses',
      color: 'border-[#F2A900]'
    },
    {
      icon: CheckCircle2,
      title: 'Knowledge Check',
      subtitle: 'Test what you have learned.',
      description: 'Take grounded knowledge checks generated directly from verified administrative guidelines and statistical manuals. Review answers with exact source page citations.',
      href: '/quiz',
      actionText: 'Try Knowledge Check',
      color: 'border-[#14B8A6]'
    },
    {
      icon: MessageSquare,
      title: 'Neeti Vivaad',
      subtitle: 'Practise making decisions through realistic scenarios.',
      description: 'Step into complex administrative dilemmas. Deliberate with simulated stakeholder perspectives, evaluate trade-offs without dogma, and receive nuanced feedback on your decision reasoning.',
      href: '/debate',
      actionText: 'Enter Neeti Vivaad',
      color: 'border-[#0B1F3A]'
    },
    {
      icon: Bot,
      title: 'Neeti Saarthi Buddy',
      subtitle: 'Get help understanding and navigating the platform.',
      description: 'An interactive, multilingual guide built right into the platform. Ask questions about features, receive step-by-step guidance, and understand your next recommended action.',
      href: '/courses',
      actionText: 'Meet Your Buddy',
      color: 'border-[#C0392B]'
    }
  ];

  return (
    <div className="w-full bg-[#F8F7F2] text-[#111111] py-10 sm:py-16 px-4 sm:px-8 font-sans">
      <div className="max-w-[1100px] mx-auto space-y-12">
        
        {/* Header Banner */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#FEF3C7] border border-[#111111] shadow-brutal-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span>ABOUT NEETI SAARTHI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight uppercase leading-tight">
            Learn, Grow &amp; Practise Better Decisions
          </h1>
          <p className="text-base sm:text-lg text-[#4B5563] font-normal leading-relaxed">
            Neeti Saarthi is a learning and decision-practice platform designed to help public officials understand their strengths, discover relevant learning opportunities, build skills and practise real-world decisions.
          </p>
        </div>

        {/* Mission Statement Box */}
        <div className="card-brutal bg-white p-6 sm:p-10 shadow-brutal-lg border-2 border-[#111111] rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#0F766E]">
            <Target className="w-4 h-4" />
            <span>Our Purpose</span>
          </div>
          <p className="text-sm sm:text-base text-[#111111] leading-relaxed font-normal">
            Public administration requires balancing complex trade-offs: statistical rigour, field feasibility, data privacy, fiscal constraints, and citizen trust. Neeti Saarthi creates a structured, safe space to practise these decisions before encountering them in high-stakes environments.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono text-[#4B5563]">
            <span className="font-bold text-[#111111]">Platform Focus:</span>
            <span>&bull; Competency Intelligence</span>
            <span>&bull; Grounded Learning</span>
            <span>&bull; Practical Decision Simulation</span>
          </div>
        </div>

        {/* 5 Core Pillars */}
        <div className="space-y-6">
          <div className="border-b-2 border-[#111111] pb-3 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tight">
              The Core Experience
            </h2>
            <span className="text-xs font-mono font-bold text-[#4B5563]">5 INTEGRATED PILLARS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div 
                  key={pillar.title}
                  className={`card-brutal bg-white p-6 sm:p-7 border-2 border-[#111111] shadow-brutal rounded-2xl flex flex-col justify-between space-y-4 ${
                    idx === pillars.length - 1 ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border-2 border-[#111111] flex items-center justify-center shadow-brutal-sm">
                        <Icon className="w-5 h-5 text-[#111111]" />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#4B5563] uppercase">
                        Step 0{idx + 1}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-extrabold uppercase text-[#111111]">
                        {pillar.title}
                      </h3>
                      <p className="text-xs font-mono font-bold text-[#0F766E] mt-0.5">
                        {pillar.subtitle}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-normal">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-200">
                    <Link
                      href={pillar.href}
                      className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase text-[#111111] hover:text-[#0F766E] transition-colors"
                    >
                      <span>{pillar.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clear Project Origins & Honesty Note */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0B1F3A] text-white border-2 border-[#111111] shadow-brutal space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2DD4BF]" />
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-[#2DD4BF]">
              Platform Context &amp; Purpose
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            Neeti Saarthi is an intelligent competency development, policy deliberation, and learning ecosystem designed to empower public servants, administrators, and policy analysts.
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The platform provides learning simulations, skill assessments, and decision-practice exercises grounded in published guidelines and official statistical methodologies. It is an educational and skills development tool and does not represent an official regulatory directive or government mandate unless explicitly authorized by the competent authorities.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-display font-extrabold uppercase tracking-wider bg-[#F2A900] text-[#111111] border-2 border-[#111111] shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
            >
              <span>Contact Support</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/privacy-policy"
              className="text-xs font-mono text-zinc-300 hover:text-white underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs font-mono text-zinc-300 hover:text-white underline underline-offset-4"
            >
              Terms of Use
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
