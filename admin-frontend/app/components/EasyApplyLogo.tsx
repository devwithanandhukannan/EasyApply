'use client';

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
    sm: { icon: 'text-[22px]', text: 'text-base font-bold' },
    md: { icon: 'text-[28px]', text: 'text-xl font-extrabold' },
    lg: { icon: 'text-[32px]', text: 'text-2xl font-black' },
    xl: { icon: 'text-[40px]', text: 'text-3xl font-black' },
  };

  const { icon, text } = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <span
        className={`material-symbols-outlined text-[#0071e3] ${icon}`}
        data-icon="rocket_launch"
        data-weight="fill"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        rocket_launch
      </span>
      <span className={`${text} text-[#0071e3] tracking-tight`}>
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
