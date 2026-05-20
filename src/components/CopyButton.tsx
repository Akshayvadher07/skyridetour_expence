'use client';

import { useEffect, useState } from 'react';

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  const handleCopy = async () => {
    if (!text.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const isDisabled = text.trim().length === 0;

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
        isDisabled
          ? 'cursor-not-allowed bg-slate-200 text-slate-500'
          : copied
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'bg-slate-900 text-white hover:bg-slate-800'
      }`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
