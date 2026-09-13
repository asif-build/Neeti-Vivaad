import React from 'react';

interface LogoProps {
  variant?: 'navbar' | 'auth' | 'hero' | 'dashboard' | 'compact' | 'footer' | 'emblem';
  isDark?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Canonical Neeti Saarthi Brand Component
 * Features mathematically transparent, crisp high-DPI assets with zero background box.
 */
export function NeetiSaarthiLogo({
  variant = 'navbar',
  isDark = false,
  className = '',
  size,
}: LogoProps) {
  // Select crisp transparent source depending on background darkness
  const logoSrc = isDark
    ? '/images/neeti_brand_logo_light_2x.png'
    : '/images/neeti_brand_logo_dark_2x.png';

  const emblemSrc = isDark
    ? '/images/neeti_tree_emblem_light.png'
    : '/images/neeti_tree_emblem_dark.png';

  // Specific sizing variants
  if (variant === 'emblem' || variant === 'compact') {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className || 'w-8 h-8'}`}>
        <img
          src={emblemSrc}
          alt="Neeti Saarthi Tree Emblem"
          width={512}
          height={512}
          loading="eager"
          decoding="async"
          className="w-full h-full object-contain block select-none"
        />
      </div>
    );
  }

  let defaultClasses = 'h-9 sm:h-10';

  if (variant === 'navbar') {
    defaultClasses = 'h-8 sm:h-9 md:h-10';
  } else if (variant === 'auth') {
    defaultClasses = 'h-10 sm:h-12';
  } else if (variant === 'hero') {
    defaultClasses = 'h-12 sm:h-14';
  } else if (variant === 'dashboard') {
    defaultClasses = 'h-9 sm:h-10';
  } else if (variant === 'footer') {
    defaultClasses = 'h-9 sm:h-10';
  }

  // Backwards compatibility with size prop
  if (size === 'sm') defaultClasses = 'h-7 sm:h-8';
  if (size === 'md') defaultClasses = 'h-9 sm:h-10';
  if (size === 'lg') defaultClasses = 'h-11 sm:h-13';

  return (
    <div className="inline-flex items-center group cursor-pointer select-none">
      <img
        src={logoSrc}
        alt="NEETI SAARTHI - Skill Intelligence for a Stronger India"
        width={1778}
        height={384}
        loading="eager"
        decoding="async"
        className={`${className || defaultClasses} w-auto max-w-full block object-contain transition-transform group-hover:scale-[1.01]`}
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
}

export const BrandLogo = NeetiSaarthiLogo;
export const Logo = NeetiSaarthiLogo;

export function VivaadTreeLogo({ 
  className = "w-10 h-10",
  isDark = false 
}: { 
  className?: string;
  isDark?: boolean;
}) {
  return <NeetiSaarthiLogo variant="emblem" className={className} isDark={isDark} />;
}

export const PlainviewSunLogo = VivaadTreeLogo;
export const SupabazeEmeraldLogo = VivaadTreeLogo;

export default NeetiSaarthiLogo;


