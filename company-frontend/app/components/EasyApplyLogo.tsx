'use client';

import { Rocket } from 'lucide-react';
import Link from 'next/link';

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
    sm: { icon: 16, text: 'text-sm' },
    md: { icon: 20, text: 'text-base' },
    lg: { icon: 24, text: 'text-xl' },
    xl: { icon: 28, text: 'text-2xl' },
  };

  const { icon, text } = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-2 font-bold tracking-tight select-none ${className}`}>
      <div className="flex items-center justify-center text-[#0071e3]">
        <Rocket size={icon} className="text-[#0071e3] fill-[#0071e3] transform -rotate-12" />
      </div>
      <span className={`${text} font-black tracking-tight text-[#0071e3]`}>
        EasyApply
      </span>
      {badge && (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
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
