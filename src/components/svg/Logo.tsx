import type { SVGProps } from 'react';

const SvgLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <rect x="2" y="12" width="4" height="8" rx="1" opacity="0.5" />
    <rect x="8" y="7" width="4" height="13" rx="1" opacity="0.75" />
    <rect x="14" y="3" width="4" height="17" rx="1" />
    <path d="M3 11 L9 7.5 L15 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
  </svg>
);
export default SvgLogo;
