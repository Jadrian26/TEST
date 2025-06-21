import React from 'react';

interface FolderIconProps {
  className?: string;
  open?: boolean; 
}

const FolderIcon: React.FC<FolderIconProps> = ({ className, open }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className || "w-6 h-6"}
      aria-hidden="true"
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 015.25 7.5h13.5a2.25 2.25 0 012.25 2.25m-16.5 0v11.25c0 .621.504 1.125 1.125 1.125h14.25c.621 0 1.125-.504 1.125-1.125V9.75M8.25 9.75L12 7.5m0 0l3.75 2.25M12 7.5v13.5" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      )}
    </svg>
  );
};

export default FolderIcon;