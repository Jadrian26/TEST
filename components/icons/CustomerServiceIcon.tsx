// components/icons/CustomerServiceIcon.tsx
import React from 'react';

interface IconProps {
  className?: string;
}

const CustomerServiceIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 73 74" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M36.3158 7.00034C19.0601 7.00034 5.26318 20.7972 5.26318 38.053C5.26318 55.3087 19.0601 69.1056 36.3158 69.1056C53.5715 69.1056 67.3684 55.3087 67.3684 38.053C67.3684 20.7972 53.5715 7.00034 36.3158 7.00034Z" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M36.3158 47.3161C43.7027 47.3161 49.6316 41.3872 49.6316 34.0003C49.6316 26.6135 43.7027 20.6846 36.3158 20.6846V34.0003H22.9997C22.9997 41.3872 28.9286 47.3161 36.3158 47.3161Z" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M52.3158 23.6846C52.3158 23.6846 58.2632 26.6582 58.2632 34.0003C58.2632 41.3425 52.3158 44.3161 52.3158 44.3161" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.3158 23.6846C20.3158 23.6846 14.3684 26.6582 14.3684 34.0003C14.3684 41.3425 20.3158 44.3161 20.3158 44.3161" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
export default CustomerServiceIcon;