// components/icons/StoreIconUyB.tsx
import React from 'react';

interface IconProps {
  className?: string;
}

const StoreIconUyB: React.FC<IconProps> = ({ className }) => (
  <svg
    id="Layer_2_StoreUyB" // Added suffix to avoid ID collision if multiple SVGs are on page
    data-name="Layer 2"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1024 806.16"
    className={className}
    fill="currentColor" // Paths inside use cls-1 for fill, this is a fallback or for unstyled parts
  >
    <defs>
      <style>{`.cls-1_storeuyb { fill: #fff; } /* Unique class name for this SVG */`}</style>
    </defs>
    <g id="ICONS_U_B_StoreUyB" data-name="ICONS U&amp;B"> {/* Added suffix */}
      <g id="TIENDA_StoreUyB" data-name="TIENDA"> {/* Added suffix */}
        <path
          className="cls-1_storeuyb"
          d="M839.91,0H184.09c-11,0-21.29,5.44-27.49,14.53L8.04,232.41c-20.74,30.41,1.04,71.63,37.85,71.63h932.21c36.81,0,58.59-41.21,37.85-71.63L867.4,14.53c-6.2-9.09-16.49-14.53-27.49-14.53Z"
        />
        <path
          className="cls-1_storeuyb"
          d="M565.12,806.16H154.84c-26.63,0-48.23-21.59-48.23-48.23v-407.83h101.35v253.37s304.04,0,304.04,0v-253.37h101.35v407.83c0,26.63-21.59,48.23-48.23,48.23Z"
        />
        <path
          className="cls-1_storeuyb"
          d="M811.43,350.1h105.95v439.57c0,9.1-7.39,16.48-16.48,16.48h-72.99c-9.1,0-16.48-7.39-16.48-16.48v-439.57h0Z"
        />
      </g>
    </g>
  </svg>
);
export default StoreIconUyB;