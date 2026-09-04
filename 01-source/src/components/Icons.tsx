type IconProps = { size?: number; className?: string };

const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const });

export function CameraIcon({ size = 20, className }: IconProps) {
  return <svg {...base(size)} className={className}><path d="M3.8 7.5A2.5 2.5 0 0 1 6.3 5h7.4a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 13.7 19H6.3a2.5 2.5 0 0 1-2.5-2.5v-9Z" stroke="currentColor" strokeWidth="1.8"/><path d="m16.2 10 3.2-1.8a.55.55 0 0 1 .82.48v6.64a.55.55 0 0 1-.82.48L16.2 14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
}

export function ScreenIcon({ size = 20, className }: IconProps) {
  return <svg {...base(size)} className={className}><rect x="3" y="4.5" width="18" height="12.5" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8.5 20h7M12 17v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

export function StopIcon({ size = 18, className }: IconProps) {
  return <svg {...base(size)} className={className}><rect x="5.5" y="5.5" width="13" height="13" rx="2.5" fill="currentColor"/></svg>;
}

export function FullscreenIcon({ size = 19, className }: IconProps) {
  return <svg {...base(size)} className={className}><path d="M8.5 4.5h-4v4M15.5 4.5h4v4M8.5 19.5h-4v-4M19.5 15.5v4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function ShieldIcon({ size = 17, className }: IconProps) {
  return <svg {...base(size)} className={className}><path d="M12 3.2 19 6v5.15c0 4.32-2.67 7.65-7 9.65-4.33-2-7-5.33-7-9.65V6l7-2.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="m8.6 12.1 2.1 2.05 4.7-4.65" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function GearIcon({ size = 19, className }: IconProps) {
  return <svg {...base(size)} className={className}><path d="M9.1 4.2 10 2.7h4l.9 1.5 1.7.7 1.7-.45 2 3.45-1.18 1.28.23 1.82 1.18 1.28-2 3.45-1.7-.45-1.72.7-.9 1.5h-4l-.9-1.5-1.7-.7-1.7.45-2-3.45L4.65 11l.23-1.82L3.7 7.9l2-3.45 1.7.45 1.7-.7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.6"/></svg>;
}

export function ChevronIcon({ size = 18, className }: IconProps) {
  return <svg {...base(size)} className={className}><path d="m7 9.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function AlertIcon({ size = 21, className }: IconProps) {
  return <svg {...base(size)} className={className}><path d="M12 3.8 21 19H3L12 3.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M12 9v4.7M12 16.7h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}
