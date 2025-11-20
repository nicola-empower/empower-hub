// src/app/components/HelperComponents.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// --- UPDATED: Toast Notification Hook ---
// This new version is more robust and prevents runtime errors on navigation.
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // This effect ensures that if the component unmounts, the timer is cleared.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    // If a toast is already shown, clear its timer before showing a new one
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast({ message, type });

    // Set a new timer to hide the toast after 4 seconds
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, 4000);
  }, []);

  const Toast = () =>
    toast ? (
      <div
        className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        role="alert"
        aria-live="assertive"
      >
        {toast.message}
      </div>
    ) : null;

  return { showToast, Toast };
}

// --- Inline Editable Text Component (Unchanged) ---
export function InlineEdit({
  value,
  onSave,
  ariaLabel,
  className,
}: {
  value: string;
  onSave: (v: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => setVal(value), [value]);

  const handleSave = () => {
    setEditing(false);
    if (val.trim() && val !== value) {
      onSave(val.trim());
    } else {
      setVal(value); // Revert if empty or unchanged
    }
  };

  return editing ? (
    <input
      ref={inputRef}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
          setEditing(false);
          setVal(value);
        }
      }}
      aria-label={ariaLabel}
      className={className || 'border rounded px-2 py-1'}
    />
  ) : (
    <span
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true); }}
      aria-label={ariaLabel}
      className={`${className || 'cursor-pointer'} cursor-pointer hover:bg-gray-200 px-2 py-1 rounded-md`}
    >
      {value}
    </span>
  );
}