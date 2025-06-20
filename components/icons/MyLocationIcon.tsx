import React from 'react';

interface MyLocationIconProps {
  className?: string;
}

const MyLocationIcon: React.FC<MyLocationIconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className || "w-5 h-5"}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 3.75v2.25m0 12v2.25m6.75-6.75h-2.25m-12 0H3.75" />
    </svg>
  );
};

export default MyLocationIcon;