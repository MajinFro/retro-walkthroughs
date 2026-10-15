import React from 'react';

export type PSButtonType =
  | 'square'
  | 'triangle'
  | 'cross'
  | 'circle'
  | 'x'
  | 'l1'
  | 'r1'
  | 'l2'
  | 'r2'
  | 'l3'
  | 'r3'
  | 'start'
  | 'select'
  | 'dpad'
  | 'up'
  | 'down'
  | 'left'
  | 'right';

interface PlayStationButtonProps {
  button: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function normalizeButtonKey(raw: string): PSButtonType | null {
  const clean = raw.replace(/^\[|\]$/g, '').trim().toLowerCase();
  switch (clean) {
    case 'square':
      return 'square';
    case 'triangle':
      return 'triangle';
    case 'cross':
    case 'x':
      return 'cross';
    case 'circle':
    case 'o':
      return 'circle';
    case 'l1':
      return 'l1';
    case 'r1':
      return 'r1';
    case 'l2':
      return 'l2';
    case 'r2':
      return 'r2';
    case 'l3':
      return 'l3';
    case 'r3':
      return 'r3';
    case 'start':
      return 'start';
    case 'select':
      return 'select';
    case 'd-pad':
    case 'dpad':
      return 'dpad';
    case 'up':
      return 'up';
    case 'down':
      return 'down';
    case 'left':
      return 'left';
    case 'right':
      return 'right';
    default:
      return null;
  }
}

export function PlayStationButton({ button, size = 'md', className = '' }: PlayStationButtonProps) {
  const type = normalizeButtonKey(button);
  if (!type) {
    return <span>{button}</span>;
  }

  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  }[size];

  // Face Buttons
  if (type === 'square') {
    return (
      <span
        title="PlayStation Square Button"
        aria-label="Square Button"
        className={`inline-flex items-center justify-center align-middle mx-1 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border border-slate-600/70 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:scale-110 hover:shadow-[0_0_8px_rgba(244,63,94,0.6)] transition-all cursor-default select-none ${sizeClasses} ${className}`}
      >
        <svg viewBox="0 0 24 24" className="w-[58%] h-[58%]" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" />
        </svg>
      </span>
    );
  }

  if (type === 'triangle') {
    return (
      <span
        title="PlayStation Triangle Button"
        aria-label="Triangle Button"
        className={`inline-flex items-center justify-center align-middle mx-1 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border border-slate-600/70 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:scale-110 hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all cursor-default select-none ${sizeClasses} ${className}`}
      >
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%]" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12,4 20,18.5 4,18.5" />
        </svg>
      </span>
    );
  }

  if (type === 'cross') {
    return (
      <span
        title="PlayStation Cross Button"
        aria-label="Cross Button"
        className={`inline-flex items-center justify-center align-middle mx-1 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border border-slate-600/70 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:scale-110 hover:shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all cursor-default select-none ${sizeClasses} ${className}`}
      >
        <svg viewBox="0 0 24 24" className="w-[58%] h-[58%]" fill="none" stroke="#3b82f6" strokeWidth="3.2" strokeLinecap="round">
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </svg>
      </span>
    );
  }

  if (type === 'circle') {
    return (
      <span
        title="PlayStation Circle Button"
        aria-label="Circle Button"
        className={`inline-flex items-center justify-center align-middle mx-1 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border border-slate-600/70 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:scale-110 hover:shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all cursor-default select-none ${sizeClasses} ${className}`}
      >
        <svg viewBox="0 0 24 24" className="w-[58%] h-[58%]" fill="none" stroke="#ef4444" strokeWidth="3">
          <circle cx="12" cy="12" r="7.5" />
        </svg>
      </span>
    );
  }

  // Shoulder buttons
  if (type === 'l1' || type === 'r1' || type === 'l2' || type === 'r2' || type === 'l3' || type === 'r3') {
    return (
      <span
        title={`PlayStation ${type.toUpperCase()} Button`}
        aria-label={`${type.toUpperCase()} Button`}
        className={`inline-flex items-center justify-center align-middle mx-1 px-1.5 py-0.5 rounded-md bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600/80 shadow-[0_1px_3px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] font-mono font-bold text-slate-200 tracking-wider hover:border-slate-400 transition-all cursor-default select-none text-[11px] h-5 min-w-[28px] ${className}`}
      >
        {type.toUpperCase()}
      </span>
    );
  }

  // Start / Select
  if (type === 'start' || type === 'select') {
    return (
      <span
        title={`PlayStation ${type.toUpperCase()} Button`}
        aria-label={`${type.toUpperCase()} Button`}
        className={`inline-flex items-center justify-center align-middle mx-1 px-2 py-0.5 rounded-full bg-gradient-to-b from-slate-700 to-slate-950 border border-slate-600/70 shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-mono font-bold text-slate-300 tracking-wider text-[10px] uppercase h-5 hover:border-slate-400 transition-all cursor-default select-none ${className}`}
      >
        {type.toUpperCase()}
      </span>
    );
  }

  // D-Pad directions
  const dpadArrows = {
    up: '▲',
    down: '▼',
    left: '◀',
    right: '▶',
    dpad: '✚',
  };

  return (
    <span
      title={`D-Pad ${type.toUpperCase()}`}
      aria-label={`D-Pad ${type.toUpperCase()}`}
      className={`inline-flex items-center justify-center align-middle mx-1 rounded-md bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border border-slate-600/70 shadow-[0_2px_3px_rgba(0,0,0,0.5)] text-slate-300 font-bold ${sizeClasses} ${className}`}
    >
      <span className="text-[10px]">{dpadArrows[type as keyof typeof dpadArrows] || '✚'}</span>
    </span>
  );
}

// Regex to capture button tokens: [Square], [Triangle], [Cross], [Circle], [X], [L1], [R1], [L2], [R2], [Start], [Select], etc.
// Also handles sequences like Square -> Triangle -> Cross when written in combo notations.
export const BUTTON_TOKEN_REGEX = /(\[(?:Square|Triangle|Cross|Circle|X|L1|R1|L2|R2|L3|R3|Start|Select|D-Pad|Up|Down|Left|Right)\]|\b(?:Square|Triangle|Cross|Circle)\b(?=\s*(?:->|\+|,|\)|$)))/gi;

/**
 * Parses a string and replaces PlayStation button tokens with styled PlayStationButton components.
 */
export function replaceButtonTokensInString(text: string): React.ReactNode {
  if (!text || typeof text !== 'string') return text;

  // Quick check before regex
  if (!/(?:\[(?:Square|Triangle|Cross|Circle|X|L1|R1|L2|R2|L3|R3|Start|Select|D-Pad|Up|Down|Left|Right)\]|Square|Triangle|Cross|Circle)/i.test(text)) {
    return text;
  }

  // Look for bracketed tokens or words that represent buttons
  const regex = /(\[(?:Square|Triangle|Cross|Circle|X|L1|R1|L2|R2|L3|R3|Start|Select|D-Pad|Up|Down|Left|Right)\])/gi;
  const parts = text.split(regex);
  if (parts.length <= 1) {
    // Check if combo string like "Square -> Triangle -> Cross"
    if (/(?:Square|Triangle|Cross|Circle)\s*->\s*(?:Square|Triangle|Cross|Circle)/i.test(text)) {
      const comboRegex = /\b(Square|Triangle|Cross|Circle)\b/gi;
      const comboParts = text.split(comboRegex);
      return comboParts.map((part, i) => {
        if (/^(Square|Triangle|Cross|Circle)$/i.test(part)) {
          return <PlayStationButton key={`btn-combo-${i}`} button={part} />;
        }
        return part;
      });
    }
    return text;
  }

  return parts.map((part, i) => {
    if (/^\[(?:Square|Triangle|Cross|Circle|X|L1|R1|L2|R2|L3|R3|Start|Select|D-Pad|Up|Down|Left|Right)\]$/i.test(part)) {
      return <PlayStationButton key={`btn-${i}`} button={part} />;
    }
    return part;
  });
}

/**
 * Recursively parses React children and injects PlayStationButton components.
 */
export function parsePlaystationButtons(children: React.ReactNode): React.ReactNode {
  if (!children) return children;

  if (typeof children === 'string') {
    return replaceButtonTokensInString(children);
  }

  if (Array.isArray(children)) {
    return React.Children.map(children, (child) => parsePlaystationButtons(child));
  }

  if (React.isValidElement(children)) {
    const props: any = children.props;
    if (props && props.children) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        children: parsePlaystationButtons(props.children),
      });
    }
  }

  return children;
}
