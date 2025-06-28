import Image from 'next/image';
import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  forceIcon?: boolean;
}

const MOBILE_BREAKPOINT = 640; // Tailwind's sm breakpoint

export default function Logo({ 
  className = '', 
  width = 120,
  forceIcon = false 
}: LogoProps) {
  const [isIcon, setIsIcon] = useState(false);
  
  useEffect(() => {
    // Set initial state
    setIsIcon(window.innerWidth < MOBILE_BREAKPOINT || forceIcon);
    
    const handleResize = () => {
      setIsIcon(window.innerWidth < MOBILE_BREAKPOINT || forceIcon);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [forceIcon]);

  const iconWidth = isIcon ? 900 : 2164;
  const iconHeight = isIcon ? 900 : 554;
  
  // Calculate the height based on the width while maintaining aspect ratio
  const calculatedHeight = Math.round((width * iconHeight) / iconWidth);

  return (
    <div className="inline-flex items-center">
      <Image
        src={isIcon ? '/icon.svg' : '/logo.svg'}
        alt="BRRLD Logo"
        width={width}
        height={calculatedHeight}
        className={className}
        priority
      />
    </div>
  );
}
