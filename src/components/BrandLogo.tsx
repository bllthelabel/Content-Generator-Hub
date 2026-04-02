import React from 'react';

interface BrandLogoProps {
  className?: string;
  white?: boolean;
  logoUrl?: string | null;
}

export default function BrandLogo({ className = '', white = false, logoUrl }: BrandLogoProps) {
  if (logoUrl) {
    return (
      <img src={logoUrl} alt="Brand Logo" className={`object-contain ${className}`} />
    );
  }

  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill={white ? "white" : "currentColor"} fillOpacity={white ? "1" : "0.1"} />
      <path d="M50 20L80 70H20L50 20Z" fill={white ? "currentColor" : "currentColor"} />
    </svg>
  );
}
