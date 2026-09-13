'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export interface ScrambleTypographyProps {
  text: string;
  className?: string;
  chars?: string;
  speed?: number; // update speed in seconds per char
  duration?: number; // total duration in seconds
  revealDelay?: number;
  autoPlay?: boolean;
}

const DEFAULT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~';

export function ScrambleTypography({
  text,
  className = '',
  chars = DEFAULT_CHARS,
  duration = 1.6,
  revealDelay = 0.2,
  autoPlay = true,
}: ScrambleTypographyProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const progressObj = useRef({ progress: 0 });

  const scrambleTo = (targetText: string, animDuration = duration) => {
    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    progressObj.current.progress = 0;
    const targetLength = targetText.length;
    const charPool = chars.length > 0 ? chars : DEFAULT_CHARS;

    tweenRef.current = gsap.to(progressObj.current, {
      progress: 1,
      duration: animDuration,
      ease: 'power3.out',
      onUpdate: () => {
        const p = progressObj.current.progress;
        const revealedCount = Math.floor(p * targetLength);
        
        let output = '';
        for (let i = 0; i < targetLength; i++) {
          if (targetText[i] === ' ') {
            output += ' ';
            continue;
          }

          if (i < revealedCount) {
            output += targetText[i];
          } else {
            // Random character from pool
            const randomChar = charPool[Math.floor(Math.random() * charPool.length)];
            output += randomChar;
          }
        }
        setDisplayText(output);
      },
      onComplete: () => {
        setDisplayText(targetText);
      }
    });
  };

  useEffect(() => {
    if (autoPlay) {
      // Trigger initial scramble with slight delay for page entry
      const timeout = setTimeout(() => {
        scrambleTo(text, duration);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [text]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    scrambleTo(text, 1.2);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-block cursor-pointer select-none transition-transform duration-300 ${className}`}
    >
      <span className="font-mono tracking-tight font-extrabold">{displayText}</span>
    </div>
  );
}
