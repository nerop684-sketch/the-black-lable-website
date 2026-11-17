import { useState } from 'react';

interface LuxuryImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function LuxuryImage({ src, alt, className = '', fallbackTitle }: LuxuryImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C1F] via-[#27272B] to-[#0B0B0C] text-[#FAF9F6] p-6 text-center ${className}`}
      >
        <span className="font-display text-lg tracking-[0.2em] text-[#C5A059] uppercase">
          THE BLACK LABEL
        </span>
        {fallbackTitle && (
          <span className="mt-2 text-xs text-neutral-300 max-w-[18ch] truncate">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
