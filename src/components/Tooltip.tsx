import React, { useState, useEffect } from 'react';

interface TooltipProps {
  x: number;
  y: number;
  children: React.ReactNode;
  isVisible?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ x, y, children, isVisible = true }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div 
      className={`
        absolute z-50 bg-white text-sm pointer-events-none
        md:shadow-sm md:p-3 md:min-w-[200px] md:border md:border-gray-200 md:rounded
        md:transform md:-translate-x-1/2 md:-translate-y-1/2
        w-full md:w-auto left-0 right-0 bottom-0 border-t border-gray-200 p-1
        transition-all duration-200 ease-out
        ${isVisible 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-2 md:translate-y-0 md:scale-95'
        }
        ${isMobile 
          ? 'transform translate-y-0' 
          : 'transform -translate-x-1/2 -translate-y-1/2'
        }
      `}
      style={{
        left: isMobile ? '0px' : `${x}px`,
        top: isMobile ? 'auto' : `${y}px`,
        right: isMobile ? '0px' : 'auto',
        bottom: isMobile ? '0px' : 'auto',
      }}
    >
      {children}
    </div>
  );
};

export const TooltipContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="space-y-1 text-gray-700">
    {children}
  </div>
);