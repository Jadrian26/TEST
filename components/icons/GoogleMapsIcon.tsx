import React from 'react';

interface GoogleMapsIconProps {
  className?: string;
  ariaHidden?: boolean;
}

const GoogleMapsIcon: React.FC<GoogleMapsIconProps> = ({ className = "w-6 h-6", ariaHidden = false }) => (
  <svg
    id="Layer_2_GoogleMaps_New_MultiColor_V2" // Unique ID
    data-name="Layer 2"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 345.04 494.41"
    className={className}
    aria-hidden={ariaHidden}
    role={ariaHidden ? undefined : "img"}
    aria-label={ariaHidden ? undefined : "Google Maps Icon"}
  >
    <defs>
      <style>
        {`
          .gm-cls-1-v2 { fill: #ea4335; }
          .gm-cls-2-v2 { fill: #fbbc04; }
          .gm-cls-3-v2 { fill: #4285f4; }
          .gm-cls-4-v2 { fill: none; }
          .gm-cls-5-v2 { fill: #1a73e8; }
          .gm-cls-6-v2 { fill: #34a853; }
          .gm-cls-7-v2 { clip-path: url(#clippath_new_gm_v2); }
        `}
      </style>
      <clipPath id="clippath_new_gm_v2"> {/* Unique clipPath ID */}
        <path className="gm-cls-4-v2" d="M325.63,92.98c-20.92-40.33-57.14-70.95-100.83-84.76C208.37,2.99,190.45,0,172.15,0,119.5,0,72.07,23.9,40.33,61.61,15.32,91.49,0,130.32,0,172.15c0,32.48,6.35,58.62,17.18,82.15,17.93,39.58,47.8,71.69,78.42,111.65,9.71,12.7,19.79,27.26,29.5,42.2,35.1,54.14,25.39,86.26,47.8,86.26s12.69-32.49,47.8-86.64c57.5-89.99,124.34-130.69,124.34-235.25,0-28.75-7.09-55.64-19.41-79.54ZM173.04,238.22c-36.36,0-65.84-29.48-65.84-65.84s29.48-65.84,65.84-65.84,65.84,29.48,65.84,65.84-29.48,65.84-65.84,65.84Z"/>
      </clipPath>
    </defs>
    <g id="ICONS_U_B_GM_New_MultiColor_V2_OuterG" data-name="ICONS U&amp;B"> {/* Unique G ID */}
      <g id="GOOGLE_MAPS_V2" data-name="GOOGLE MAPS"> {/* Unique G ID */}
        <g className="gm-cls-7-v2">
          <polygon className="gm-cls-6-v2" points="84.83 379.33 345.26 70.13 376.61 243.59 173.04 514.34 84.83 379.33"/>
          <polygon className="gm-cls-1-v2" points="18.8 42.6 122.53 130.14 0 274.34 -109.87 156.97 18.8 42.6"/>
          <polyline className="gm-cls-2-v2" points="223.04 215.22 84.83 379.33 0 274.34 122.53 130.14"/>
          <polygon className="gm-cls-3-v2" points="223.04 215.22 345.26 70.13 240.81 -10.61 122.53 130.14 223.04 215.22"/>
          <polygon className="gm-cls-5-v2" points="122.53 130.14 239 -7.98 116.32 -84.84 3.38 29.72 122.53 130.14"/>
        </g>
      </g>
    </g>
  </svg>
);

export default GoogleMapsIcon;