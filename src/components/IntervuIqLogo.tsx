import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showImage?: boolean;
}

export const IntervuIqLogo: React.FC<LogoProps> = ({
  className = '',
  iconOnly = false,
  size = 'md',
  showImage = false,
}) => {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-sm', sub: 'text-xs', gap: 'gap-2', divider: 'h-5' },
    md: { icon: 'w-8 h-8', text: 'text-base', sub: 'text-sm', gap: 'gap-3', divider: 'h-6' },
    lg: { icon: 'w-10 h-10', text: 'text-xl', sub: 'text-base', gap: 'gap-3.5', divider: 'h-8' },
    xl: { icon: 'w-14 h-14', text: 'text-2xl', sub: 'text-lg', gap: 'gap-4', divider: 'h-10' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      {/* Logo Emblem / Icon */}
      <div className={`relative flex items-center justify-center shrink-0 ${currentSize.icon}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(139,92,246,0.3)]"
        >
          {/* Outer circle stroke (white) on left and top-right */}
          <path
            d="M 50 10 A 40 40 0 1 0 85 65"
            stroke="#FFFFFF"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* Inner vertical dividing line / D-shape stroke */}
          <path
            d="M 50 20 L 50 80"
            stroke="#FFFFFF"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Vibrant Purple Checkmark */}
          <path
            d="M 40 55 L 56 72 L 90 32"
            stroke="#8B5CF6"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {!iconOnly && (
        <>
          {/* Vertical Divider */}
          <div className={`w-[1.5px] bg-purple-500/40 rounded-full shrink-0 ${currentSize.divider}`} />

          {/* Text Brand */}
          <div className="flex flex-col justify-center leading-none tracking-wider font-extrabold select-none">
            <span className={`text-white uppercase ${currentSize.text} font-bold tracking-tight`}>
              INTERVU
            </span>
            <span className={`text-purple-400 uppercase ${currentSize.sub} font-black tracking-widest mt-0.5`}>
              IQ
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default IntervuIqLogo;
