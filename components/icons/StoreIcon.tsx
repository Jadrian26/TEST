// components/icons/StoreIcon.tsx
import React from 'react';

interface IconProps {
  className?: string;
}

const StoreIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 68 54" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M67.0435 15.9091V54H0V15.9091M67.0435 15.9091L33.5217 0L0 15.9091M67.0435 15.9091H0" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25.3043 54V36.5455C25.3043 33.5852 27.7554 31.2273 30.7174 31.2273H36.3261C39.288 31.2273 41.7391 33.5852 41.7391 36.5455V54" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
export default StoreIcon;