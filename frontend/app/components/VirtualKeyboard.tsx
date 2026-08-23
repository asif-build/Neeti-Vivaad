'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Delete, CornerDownLeft, Smile, Mic } from 'lucide-react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  suggestions?: string[];
  onSuggestionClick?: (word: string) => void;
}

export function VirtualKeyboard({
  onKeyPress,
  onDelete,
  onEnter,
  suggestions = ['"Rajesh"', 'rajesh.kumar@mospi.gov.in', 'SSO-NSO-2026'],
  onSuggestionClick
}: VirtualKeyboardProps) {
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload typing keypress audio effect (Sound Effect by u_a4gfvwagf1 from Pixabay)
    audioRef.current = new Audio('/sounds/keypress.mp3');
  }, []);

  const playTypeSound = () => {
    try {
      if (audioRef.current) {
        // Clone audio node for instant overlapping keypress sounds
        const soundClone = audioRef.current.cloneNode() as HTMLAudioElement;
        soundClone.volume = 0.6;
        soundClone.play().catch(() => {});
      }
    } catch (e) {
      // Audio fallback
    }
  };

  const handleKeyClick = (key: string) => {
    playTypeSound();
    const letter = (isShift || isCaps) ? key.toUpperCase() : key.toLowerCase();
    onKeyPress(letter);
    if (isShift && !isCaps) setIsShift(false);
  };

  const handleSpace = () => {
    playTypeSound();
    onKeyPress(' ');
  };

  const handleDelete = () => {
    playTypeSound();
    onDelete();
  };

  const handleEnter = () => {
    playTypeSound();
    onEnter();
  };

  const rows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  return (
    <div className="w-full max-w-[440px] bg-[#e2e4e8]/90 backdrop-blur-md rounded-[28px] p-3 shadow-2xl border border-white/60 select-none font-sans">
      
      {/* Top Auto-Suggest Strip */}
      <div className="grid grid-cols-3 gap-1 px-2 py-1.5 mb-2 border-b border-black/5 text-center">
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => {
              playTypeSound();
              if (onSuggestionClick) onSuggestionClick(sug.replace(/^"/, '').replace(/"$/, ''));
            }}
            className="text-xs text-[#1c1c1e] font-normal truncate hover:bg-white/50 py-1 px-2 rounded-[6px] transition-colors"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* QWERTY Row 1 */}
      <div className="flex justify-center gap-1 mb-2">
        {rows[0].map(key => (
          <button
            key={key}
            onClick={() => handleKeyClick(key)}
            className="flex-1 h-11 bg-white text-[#1c1c1e] text-lg font-normal rounded-[7px] shadow-[0_1px_0_rgba(0,0,0,0.3)] active:bg-[#b8bcc4] active:translate-y-[1px] transition-all flex items-center justify-center"
          >
            {(isShift || isCaps) ? key.toUpperCase() : key}
          </button>
        ))}
      </div>

      {/* QWERTY Row 2 */}
      <div className="flex justify-center gap-1 mb-2 px-3">
        {rows[1].map(key => (
          <button
            key={key}
            onClick={() => handleKeyClick(key)}
            className="flex-1 h-11 bg-white text-[#1c1c1e] text-lg font-normal rounded-[7px] shadow-[0_1px_0_rgba(0,0,0,0.3)] active:bg-[#b8bcc4] active:translate-y-[1px] transition-all flex items-center justify-center"
          >
            {(isShift || isCaps) ? key.toUpperCase() : key}
          </button>
        ))}
      </div>

      {/* QWERTY Row 3 (Shift + Keys + Backspace) */}
      <div className="flex justify-center gap-1 mb-2">
        <button
          onClick={() => {
            playTypeSound();
            setIsShift(!isShift);
          }}
          className={`w-11 h-11 ${isShift ? 'bg-[#3478f6] text-white' : 'bg-[#abb0bc] text-[#1c1c1e]'} rounded-[7px] shadow-[0_1px_0_rgba(0,0,0,0.3)] active:scale-95 transition-all flex items-center justify-center`}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M12 3l-8 9h5v9h6v-9h5z" />
          </svg>
        </button>

        {rows[2].map(key => (
          <button
            key={key}
            onClick={() => handleKeyClick(key)}
            className="flex-1 h-11 bg-white text-[#1c1c1e] text-lg font-normal rounded-[7px] shadow-[0_1px_0_rgba(0,0,0,0.3)] active:bg-[#b8bcc4] active:translate-y-[1px] transition-all flex items-center justify-center"
          >
            {(isShift || isCaps) ? key.toUpperCase() : key}
          </button>
        ))}

        <button
          onClick={handleDelete}
          className="w-11 h-11 bg-[#abb0bc] text-[#1c1c1e] rounded-[7px] shadow-[0_1px_0_rgba(0,0,0,0.3)] active:bg-[#979da9] active:translate-y-[1px] transition-all flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Action Row (ABC, Space, Blue Return) */}
      <div className="flex justify-between items-center gap-1 mb-1">
        <button
          onClick={() => {
            playTypeSound();
            setIsCaps(!isCaps);
          }}
          className={`w-20 h-11 ${isCaps ? 'bg-[#3478f6] text-white' : 'bg-[#abb0bc] text-[#1c1c1e]'} text-xs font-semibold rounded-[7px] shadow-[0_1px_0_rgba(0,0,0,0.3)] active:translate-y-[1px] transition-all flex items-center justify-center`}
        >
          ABC
        </button>

        <button
          onClick={handleSpace}
          className="flex-1 h-11 bg-white text-[#1c1c1e] rounded-[7px] shadow-[0_1px_0_rgba(0,0,0,0.3)] active:bg-[#b8bcc4] active:translate-y-[1px] transition-all"
        />

        <button
          onClick={handleEnter}
          className="w-20 h-11 bg-[#007aff] text-white text-base font-semibold rounded-[7px] shadow-[0_1px_0_rgba(0,122,255,0.4)] active:bg-[#0062cc] active:translate-y-[1px] transition-all flex items-center justify-center"
        >
          <CornerDownLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Toolbar (Emoji & Mic) */}
      <div className="flex justify-between items-center px-4 pt-1 text-[#6e7480]">
        <button onClick={() => playTypeSound()} className="hover:text-black transition-colors">
          <Smile className="w-6 h-6" />
        </button>
        <button onClick={() => playTypeSound()} className="hover:text-black transition-colors">
          <Mic className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
