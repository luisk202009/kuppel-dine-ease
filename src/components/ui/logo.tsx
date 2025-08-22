import React from 'react';
import { useTheme } from 'next-themes';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  width = 120, 
  height = 40 
}) => {
  const { theme } = useTheme();
  
  // Use the appropriate logo based on theme
  const logoSrc = theme === 'dark' 
    ? 'https://app.kuppel.co/assets/img/logo-kuppel-blanco.png'
    : 'https://lirp.cdn-website.com/d704af89/dms3rep/multi/opt/Imagotipo-fondo-claro-e4496d03-183w.png';

  return (
    <img
      src={logoSrc}
      alt="Kuppel POS System"
      className={`object-contain transition-opacity duration-300 ${className}`}
      style={{ width, height }}
      loading="eager"
      onError={(e) => {
        // Fallback to a simple text logo if images fail to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.innerHTML = '<span style="font-size: 24px; font-weight: bold; color: hsl(var(--primary));">kuppel</span>';
        target.parentNode?.appendChild(fallback);
      }}
    />
  );
};

export default Logo;