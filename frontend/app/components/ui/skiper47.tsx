"use client";

import { motion } from "framer-motion";
import { 
  ChevronLeftIcon, ChevronRightIcon, 
  Cpu, BookOpen, MessageSquare, Award, BarChart3, Briefcase, 
  Sparkles, ArrowRight, ShieldCheck, CheckCircle2 
} from "lucide-react";
import React from "react";
import Link from "next/link";
import {
  Autoplay,
  EffectCoverflow,
  Navigation,
  Pagination,
} from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css";
import "swiper/css/effect-cards";

import { cn } from "@/lib/utils";

export interface CapabilityCardItem {
  id: string;
  title: string;
  badge: string;
  badgeColor?: string;
  icon: React.ElementType;
  description: string;
  metricLabel: string;
  metricValue: string;
  tag: string;
  link?: string;
  gradient: string;
}

export const PLATFORM_CAPABILITIES_DATA: CapabilityCardItem[] = [
  {
    id: "competency-mapping",
    title: "FAISS Semantic Competency Mapping",
    badge: "SKILL GAP ENGINE",
    badgeColor: "#3ecf8e",
    icon: Cpu,
    description: "Continuous diagnostic benchmarking across Statistical Methodology, Technical Tools, Digital Governance, and Behavioural domains.",
    metricLabel: "Accuracy",
    metricValue: "99.4%",
    tag: "Vector Embeddings",
    link: "/dashboard",
    gradient: "from-zinc-950 via-zinc-900 to-zinc-950 border-emerald-500/30",
  },
  {
    id: "assessment-studio",
    title: "Grounded AI Assessment Studio",
    badge: "VERIFIED RAG",
    badgeColor: "#38bdf8",
    icon: BookOpen,
    description: "Upload statistical survey manuals or ministry circulars. Generate instant, syllabus-grounded MCQs with zero hallucination and page-level citations.",
    metricLabel: "Hallucination",
    metricValue: "0.00%",
    tag: "Citation-Backed",
    link: "/quiz",
    gradient: "from-zinc-950 via-zinc-900 to-zinc-950 border-sky-500/30",
  },
  {
    id: "debate-arena",
    title: "Multi-Agent Policy Debate Arena",
    badge: "DECISION SIMULATOR",
    badgeColor: "#a855f7",
    icon: MessageSquare,
    description: "Engage with 4 distinct AI stakeholder personas debating complex policy trade-offs. Spot logical fallacies and inject dynamic constraints.",
    metricLabel: "Personas",
    metricValue: "4 Agents",
    tag: "Real-time Fallacy Hunter",
    link: "/debate",
    gradient: "from-zinc-950 via-zinc-900 to-zinc-950 border-purple-500/30",
  },
  {
    id: "ctq-quotient",
    title: "Critical Thinking Quotient (CTQ)",
    badge: "COGNITIVE METRIC",
    badgeColor: "#f59e0b",
    icon: Award,
    description: "Quantify officer analytical depth, fallacy detection accuracy, and decision consistency through structured judgment evaluation trees.",
    metricLabel: "Score Index",
    metricValue: "0 - 100",
    tag: "Evidence-Based",
    link: "/dashboard",
    gradient: "from-zinc-950 via-zinc-900 to-zinc-950 border-amber-500/30",
  },
  {
    id: "heatmap-analytics",
    title: "Department Heatmap Analytics",
    badge: "LEADERSHIP INTEL",
    badgeColor: "#ec4899",
    icon: BarChart3,
    description: "Provides Director Generals with macro visibility into division strengths, capability deficits, and training compliance across all field units.",
    metricLabel: "Coverage",
    metricValue: "All Field Units",
    tag: "Director General View",
    link: "/admin-dashboard",
    gradient: "from-zinc-950 via-zinc-900 to-zinc-950 border-pink-500/30",
  },
  {
    id: "recruitment-allocation",
    title: "Smart e-Recruitment & Placement",
    badge: "TALENT MATCH",
    badgeColor: "#10b981",
    icon: Briefcase,
    description: "Automatically matches tested officer proficiencies and CTQ ratings with high-priority vacancies for objective, merit-based deployment.",
    metricLabel: "Placement Fit",
    metricValue: "Automated",
    tag: "Merit Allocation",
    link: "/admin-dashboard",
    gradient: "from-zinc-950 via-zinc-900 to-zinc-950 border-emerald-500/30",
  },
];

export interface Carousel001Props {
  images?: { src: string; alt: string }[];
  cards?: CapabilityCardItem[];
  className?: string;
  showPagination?: boolean;
  showNavigation?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  spaceBetween?: number;
}

const Carousel_001 = ({
  images,
  cards = PLATFORM_CAPABILITIES_DATA,
  className,
  showPagination = true,
  showNavigation = true,
  loop = true,
  autoplay = false,
  spaceBetween = 30,
}: Carousel001Props) => {
  const css = `
  .Carousal_001 {
    padding-bottom: 50px !important;
    padding-top: 20px !important;
  }
  .Carousal_001 .swiper-pagination-bullet {
    background: #707070 !important;
    opacity: 0.4;
    transition: all 0.3s ease;
  }
  .Carousal_001 .swiper-pagination-bullet-active {
    background: #3ecf8e !important;
    opacity: 1;
    width: 24px !important;
    border-radius: 9999px !important;
  }
  `;

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.2,
      }}
      className={cn("w-full relative max-w-[1100px] mx-auto", className)}
    >
      <style>{css}</style>

      <Swiper
        spaceBetween={spaceBetween}
        autoplay={
          autoplay
            ? {
                delay: 3000,
                disableOnInteraction: false,
              }
            : false
        }
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        loop={loop}
        breakpoints={{
          320: {
            slidesPerView: 1.15,
            spaceBetween: 16,
          },
          640: {
            slidesPerView: 1.6,
            spaceBetween: 24,
          },
          1024: {
            slidesPerView: 2.3,
            spaceBetween: 32,
          },
        }}
        coverflowEffect={{
          rotate: 0,
          slideShadows: false,
          stretch: 0,
          depth: 120,
          modifier: 2.2,
        }}
        pagination={
          showPagination
            ? {
                clickable: true,
              }
            : false
        }
        navigation={
          showNavigation
            ? {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
              }
            : false
        }
        className="Carousal_001"
        modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
      >
        {images && images.length > 0
          ? images.map((image, index) => (
              <SwiperSlide key={index} className="!h-[360px] w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
                <img
                  className="h-full w-full object-cover"
                  src={image.src}
                  alt={image.alt}
                />
              </SwiperSlide>
            ))
          : cards.map((card) => {
              const IconC = card.icon;
              return (
                <SwiperSlide
                  key={card.id}
                  className="!h-[360px] w-full rounded-2xl bg-zinc-950 text-white p-7 border border-zinc-800 flex flex-col justify-between shadow-2xl relative overflow-hidden group select-none transition-all duration-300"
                >
                  {/* Subtle Background Glow */}
                  <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-[#3ecf8e]/10 blur-3xl pointer-events-none" />
                  
                  {/* Top: Badge + Icon */}
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[#3ecf8e] shadow-sm">
                        <IconC className="w-6 h-6" />
                      </div>
                      <span 
                        className="text-[11px] font-mono font-semibold uppercase px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300"
                        style={{ borderColor: `${card.badgeColor}40` }}
                      >
                        {card.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl font-semibold text-white tracking-tight leading-snug">
                        {card.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-3">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom: Metric Stats & Action */}
                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between relative z-10">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block">
                        {card.metricLabel}
                      </span>
                      <span className="text-sm font-semibold font-mono text-[#3ecf8e]">
                        {card.metricValue}
                      </span>
                    </div>

                    {card.link && (
                      <Link
                        href={card.link}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-white border border-zinc-700 hover:border-zinc-600 transition-all"
                      >
                        <span>Explore</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#3ecf8e]" />
                      </Link>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}

        {showNavigation && (
          <div className="hidden sm:block">
            <button 
              type="button"
              className="swiper-button-next after:hidden !w-10 !h-10 !rounded-full !bg-black/80 !border !border-zinc-700 !text-white flex items-center justify-center hover:!bg-black shadow-lg transition-all !right-2"
              aria-label="Next Slide"
            >
              <ChevronRightIcon className="h-5 w-5 text-white" />
            </button>
            <button 
              type="button"
              className="swiper-button-prev after:hidden !w-10 !h-10 !rounded-full !bg-black/80 !border !border-zinc-700 !text-white flex items-center justify-center hover:!bg-black shadow-lg transition-all !left-2"
              aria-label="Previous Slide"
            >
              <ChevronLeftIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        )}
      </Swiper>
    </motion.div>
  );
};

export { Carousel_001 };

const Skiper47 = () => {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden py-6">
      <Carousel_001 showPagination showNavigation loop />
    </div>
  );
};

export { Skiper47 };
export default Skiper47;
