import { useEffect, useState } from 'react';

// Hook to read presence from localStorage and listen for updates via CustomEvent
export function usePresence(email) {
  const [presence, setPresence] = useState(() => {
    if (!email) return null;
    const val = localStorage.getItem(`presence_${email}`);
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (!email) return;

    const handler = (e) => {
      const detail = e.detail;
      if (detail && detail.email === email) {
        setPresence({ status: detail.status, lastSeen: detail.lastSeen });
      }
    };

    window.addEventListener('presence:update', handler);

    // also watch localStorage changes (other tabs)
    const storageHandler = (e) => {
      if (e.key === `presence_${email}`) {
        try {
          const parsed = JSON.parse(e.newValue);
          setPresence(parsed);
        } catch (err) {}
      }
    };

    window.addEventListener('storage', storageHandler);

    return () => {
      window.removeEventListener('presence:update', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, [email]);

  return presence;
}

export function formatLastSeen(isoString) {
  if (!isoString) return '';
  const then = new Date(isoString);
  const diff = Date.now() - then.getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}