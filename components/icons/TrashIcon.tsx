
import React from 'react';

interface TrashIconProps {
  className?: string;
}

const TrashIcon: React.FC<TrashIconProps> = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={1.5} 
      stroke="currentColor" 
      className={className || "w-5 h-5"}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.24.032 3.22.094m7.096-2.472c-.372-.218-.77-.403-1.19-.572M6.353 5.004M4.95 5.79c-.342.052-.682.107-1.022.166m12.854 0A48.09 48.09 0 019.04 5.197m9.968-3.21c-.342.052-.682.107-1.022.166" />
    </svg>
  );
};

export default TrashIcon;