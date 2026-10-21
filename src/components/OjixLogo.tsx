import React from 'react';

interface OjixLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function OjixLogo({ size = 36, className = '', showText = false }: OjixLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* OJIX Circular Badge Logo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 rounded-full shadow-sm shadow-blue-500/20"
        aria-label="OJIX Logo"
      >
        <defs>
          <clipPath id="ojix-navbar-circle">
            <circle cx="100" cy="100" r="96" />
          </clipPath>
          <linearGradient id="ojix-blue-grad" x1="0" y1="0" x2="200" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="1" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        {/* Circular White Badge with Subtle Border */}
        <circle
          cx="100"
          cy="100"
          r="96"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="4"
        />

        {/* Top Electric Blue Header Bar */}
        <rect
          x="0"
          y="0"
          width="200"
          height="42"
          fill="url(#ojix-blue-grad)"
          clipPath="url(#ojix-navbar-circle)"
        />

        {/* OJIX Brand Letters */}
        <text
          x="100"
          y="146"
          textAnchor="middle"
          fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="70"
          letterSpacing="-1.5px"
        >
          <tspan fill="#0F172A">OJI</tspan>
          <tspan fill="#2563EB">X</tspan>
        </text>
      </svg>

      {showText && (
        <span className="font-extrabold text-base tracking-tight text-white inline-flex items-center gap-1.5">
          <span>OJIX</span>
          <span className="text-blue-400 font-bold">•</span>
          <span>ClientFlow</span>
        </span>
      )}
    </div>
  );
}

export default OjixLogo;
