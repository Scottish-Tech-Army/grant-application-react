import { useCallback, useState } from 'react';

type ClipboardState = {
  isCopying: boolean;
  lastError: string | null;
};

async function copyWithFallback(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function useClipboard() {
  const [state, setState] = useState<ClipboardState>({
    isCopying: false,
    lastError: null,
  });

  const copy = useCallback(async (text: string) => {
    setState({ isCopying: true, lastError: null });
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        await copyWithFallback(text);
      }
      setState({ isCopying: false, lastError: null });
      return true;
    } catch (error) {
      setState({
        isCopying: false,
        lastError: error instanceof Error ? error.message : 'Copy failed',
      });
      return false;
    }
  }, []);

  return { ...state, copy };
}
