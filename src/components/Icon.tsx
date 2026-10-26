import React from 'react';

const PATHS: Record<string, React.ReactNode> = {
  'search': (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  'user': (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </>
  ),
  'pin': (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  'box': (
    <>
      <path d="m12 3 9 5v10l-9 5-9-5V8Z" />
      <path d="m3 8 9 5 9-5M12 13v10M7.5 5.5l9 5v5" />
    </>
  ),
  'cart': (
    <>
      <path d="M2 3h3l2.5 12.5h11L21 7H6" />
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="18" cy="20" r="1.3" />
    </>
  ),
  'menu': (
    <path d="M4 6h16M4 12h16M4 18h16" />
  ),
  'heart': (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  'truck': (
    <>
      <path d="M1 4h13v13H1zM14 9h4l4 4v4h-8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </>
  ),
  'shield': (
    <>
      <path d="M12 2 3.5 5v6c0 6 8.5 11 8.5 11s8.5-5 8.5-11V5Z" />
      <path d="m8 11 3 3 5-6" />
    </>
  ),
  'chat': (
    <>
      <path d="M21 11.5a9 9 0 0 1-9 8.5 11 11 0 0 1-4-.7L3 21l1.7-5A8 8 0 0 1 3 11.5a9 9 0 0 1 18 0Z" />
      <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" />
    </>
  ),
  'arrow-right': (
    <path d="M4 12h16m-6-6 6 6-6 6" />
  ),
  'external': (
    <>
      <path d="M14 3h7v7M21 3 10 14" />
      <path d="M21 14v6H4V3h6" />
    </>
  ),
  'spark': (
    <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" />
  ),
  'plus': (
    <path d="M12 5v14M5 12h14" />
  ),
  'close': (
    <path d="m6 6 12 12M6 18 18 6" />
  ),
  'check': (
    <path d="m5 12 4 4L19 6" />
  )
};

export interface IconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ name, className = '', style }) => {
  const content = PATHS[name] || PATHS['box'];
  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={style}
    >
      {content}
    </svg>
  );
};
