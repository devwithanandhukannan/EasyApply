'use client';

import Link from 'next/link';
import { Rocket } from 'lucide-react';

interface EasyApplyLogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  badge?: string;
  className?: string;
  onClick?: () => void;
}

export default function EasyApplyLogo({
  href = '/dashboard',
  size = 'md',
  badge,
  className = '',
  onClick,
}: EasyApplyLogoProps) {
  const sizeMap = {
    sm: { box: 'w-7 h-7 rounded-lg', icon: 'w-3.5 h-3.5', text: 'text-base font-bold' },
    md: { box: 'w-8 h-8 rounded-xl', icon: 'w-4.5 h-4.5', text: 'text-xl font-black' },
    lg: { box: 'w-10 h-10 rounded-2xl', icon: 'w-5 h-5', text: 'text-2xl font-black' },
    xl: { box: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6', text: 'text-3xl font-black' },
  };

  const { box, icon, text } = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`${box} bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0`}>
        <Rocket className={`${icon} -rotate-12 fill-white/20`} />
      </div>
      <span className={`${text} text-white tracking-tight font-sans`}>
        EasyApply
      </span>
      {badge && (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

