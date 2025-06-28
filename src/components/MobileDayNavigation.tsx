import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface NavigationButtonProps {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  onClick,
  disabled,
  children,
  ariaLabel,
}) => {
  const theme = useTheme();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{ 
        border: `1px solid ${theme.sunsetOrange}`
      }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};


interface MobileDayNavigationProps {
  currentDayIndex: number;
  totalDays: number;
  currentDate: string;
  onPreviousDay: () => void;
  onNextDay: () => void;
  isFirstDay: boolean;
  isLastDay: boolean;
  className?:string;
}

export const MobileDayNavigation: React.FC<MobileDayNavigationProps> = ({
  currentDate,
  onPreviousDay,
  onNextDay,
  isFirstDay,
  isLastDay,
  className,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Check if current date is today
  const isToday = () => {
    if (!currentDate) return false;
    const today = new Date();
    const current = new Date(currentDate);
    return today.toDateString() === current.toDateString();
  };

  const isBackDisabled = isFirstDay || isToday();
  const isForwardDisabled = isLastDay;

  return (
    <div className={`flex items-center justify-between w-full px-6 pt-4 ${className}`}>
        <span className="text-sm font-medium">
          {currentDate ? formatDate(currentDate) : 'Loading...'}
        </span>
      
      <div className="flex items-center space-x-4">
        <NavigationButton
          onClick={onPreviousDay}
          disabled={isBackDisabled}
          ariaLabel="Previous day"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </NavigationButton>
        
        <NavigationButton
          onClick={onNextDay}
          disabled={isForwardDisabled}
          ariaLabel="Next day"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </NavigationButton>
      </div>
    </div>
  );
};

export default MobileDayNavigation; 