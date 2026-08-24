'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export function SingleViewportLanding() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Animated stat values state
  const [stat1, setStat1] = useState('0ms');
  const [stat2, setStat2] = useState('0.00%');
  const [stat3, setStat3] = useState('0/7');
  const [stat4, setStat4] = useState('0.0M');

  useEffect(() => {
    // Count-up animation helper
    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animateValue(target: number, decimals: number, suffix: string, startOffset: number, duration: number, setter: (val: string) => void) {
      setTimeout(() => {
        let startTime: number | null = null;
        function step(timestamp: number) {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(1, elapsed / duration);
          const current = target * easeOutCubic(progress);
          setter(current.toFixed(decimals) + suffix);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            setter(target.toFixed(decimals) + suffix);
          }
        }
        requestAnimationFrame(step);
      }, startOffset);
    }

    animateValue(120, 0, 'ms', 480, 1500, setStat1);
    animateValue(99.99, 2, '%', 570, 1580, setStat2);
    animateValue(24, 0, '/7', 660, 1660, setStat3);
    animateValue(2.4, 1, 'M', 750, 1740, setStat4);
  }, []);

  return (
    <div className="bg-black text-white h-screen h-[100dvh] overflow-hidden select-none relative font-sans">
      
      {/* Full-Viewport Background Video */}
      <div className="bg-video-container">
        <video className="bg-video-el" autoPlay muted loop playsInline>
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Single Viewport 3-Region Page Layout */}
      <div className="single-vp-page">

        {/* 1) HEADER */}
        <header className="vp-header">
          <div className="vp-header-inner">
            {/* Circular Brand Logo Button */}
            <Link href="/" className="vp-logo-btn" aria-label="Home">
              <img src="/assets/logo.webp" alt="" width={52} height={52} className="vp-logo-img" />
            </Link>

            {/* White Nav Pill */}
            <nav className="vp-nav-pill" aria-label="Main Navigation">
              <Link href="/" className="vp-nav-link active">Home</Link>
              <Link href="/dashboard" className="vp-nav-link">Product</Link>
              <Link href="/debate" className="vp-nav-link">Case Studies</Link>
              <Link href="/quiz" className="vp-nav-link">Contact</Link>
            </nav>

            {/* Dark Sign-in Pill */}
            <Link href="/dashboard" className="vp-sign-in-btn">Get started</Link>
          </div>

          {/* Mobile Circular Burger Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="vp-burger-btn"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <span className={`vp-burger-bar vp-bar-1 ${mobileOpen ? 'vp-bar-1-open' : ''}`} />
            <span className={`vp-burger-bar vp-bar-2 ${mobileOpen ? 'vp-bar-2-open' : ''}`} />
            <span className={`vp-burger-bar vp-bar-3 ${mobileOpen ? 'vp-bar-3-open' : ''}`} />
          </button>
        </header>

        {/* 2) HERO (Center Region) */}
        <main className="vp-hero">
          
          {/* Trust Row ("Trusted by 2000+ Enterprises") */}
          <div className="vp-trust-row vp-anim" style={{ '--d': '0.05s' } as React.CSSProperties}>
            <div className="vp-avatar-ring vp-avatar-1" title="Microsoft">
              <div className="vp-avatar-inner">
                <i className="fa-brands fa-microsoft" />
              </div>
            </div>
            <div className="vp-avatar-ring vp-avatar-2" title="Amazon">
              <div className="vp-avatar-inner">
                <i className="fa-brands fa-amazon" />
              </div>
            </div>
            <div className="vp-avatar-ring vp-avatar-3" title="Google">
              <div className="vp-avatar-inner">
                <i className="fa-brands fa-google" />
              </div>
            </div>

            <div className="vp-trust-pill">
              <span>Trusted by 2000+ Enterprises</span>
            </div>
          </div>

          {/* Two-line Solid White Dot-Matrix Headline */}
          <h1 className="vp-headline">
            <span className="vp-line vp-line-1">Intelligence</span>
            <span className="vp-line vp-line-2">Designed To Evolve</span>
          </h1>

          {/* Subhead */}
          <p className="vp-subhead vp-anim" style={{ '--d': '0.28s' } as React.CSSProperties}>
            Build applications that reason, adapt and collaborate using a modular
            AI platform designed for production.
          </p>

          {/* CTA White Glow Pill */}
          <div className="vp-cta-wrapper vp-anim-pulse" style={{ '--d': '0.4s' } as React.CSSProperties}>
            <Link href="/debate" className="vp-cta-btn">
              Get Started
            </Link>
          </div>

        </main>

        {/* 3) STATS FOOTER (4 Exact Metrics) */}
        <footer className="vp-stats-footer">
          <div className="vp-stats-grid">
            
            <div className="vp-stat-item vp-anim" style={{ '--d': '0.5s' } as React.CSSProperties}>
              <div className="vp-stat-icon">&lt;</div>
              <div className="vp-stat-value">{stat1}</div>
              <div className="vp-stat-label">Inference Time</div>
            </div>

            <div className="vp-stat-item vp-anim" style={{ '--d': '0.58s' } as React.CSSProperties}>
              <div className="vp-stat-icon">%</div>
              <div className="vp-stat-value">{stat2}</div>
              <div className="vp-stat-label">Platform Uptime</div>
            </div>

            <div className="vp-stat-item vp-anim" style={{ '--d': '0.66s' } as React.CSSProperties}>
              <div className="vp-stat-icon">*</div>
              <div className="vp-stat-value">{stat3}</div>
              <div className="vp-stat-label">Autonomous Runtime</div>
            </div>

            <div className="vp-stat-item vp-anim" style={{ '--d': '0.74s' } as React.CSSProperties}>
              <div className="vp-stat-icon">#</div>
              <div className="vp-stat-value">{stat4}</div>
              <div className="vp-stat-label">Context Windows</div>
            </div>

          </div>
        </footer>

      </div>

      {/* Mobile Sheet Menu */}
      {mobileOpen && (
        <div className="vp-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="vp-mobile-menu-sheet" onClick={(e) => e.stopPropagation()}>
            <nav className="vp-mobile-nav">
              <Link href="/" className="vp-mobile-link active" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link href="/dashboard" className="vp-mobile-link" onClick={() => setMobileOpen(false)}>Product</Link>
              <Link href="/debate" className="vp-mobile-link" onClick={() => setMobileOpen(false)}>Case Studies</Link>
              <Link href="/quiz" className="vp-mobile-link" onClick={() => setMobileOpen(false)}>Contact</Link>
            </nav>
            <Link href="/debate" className="vp-mobile-sign-in" onClick={() => setMobileOpen(false)}>Sign in</Link>
          </div>
        </div>
      )}

    </div>
  );
}
