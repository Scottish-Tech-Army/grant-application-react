import React, { useEffect } from "react";

export default function Toast({ message, onClose }: { message: string; onClose: () => void }): JSX.Element | null {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onClose, 2200);
    return () => window.clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;
  return <div className="toast">{message}</div>;
}
