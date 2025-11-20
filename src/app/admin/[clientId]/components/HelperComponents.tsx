// app/admin/[clientId]/components/HelperComponents.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

// --- Toast Notification Hook ---
// This hook manages toast notifications for success or error messages.
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const Toast = () =>
    toast ? (
      <div
        className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}
        role="alert"
        aria-live="assertive"
      >
        {toast.message}
      </div>
    ) : null;
  return { showToast, Toast };
}

// --- Inline Editable Text Component ---
// This component allows text to be edited in place.
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
  return editing ? (
    <input
      ref={inputRef}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (val.trim() && val !== value) onSave(val.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          setEditing(false);
          if (val.trim() && val !== value) onSave(val.trim());
        }
        if (e.key === 'Escape') setEditing(false);
      }}
      aria-label={ariaLabel}
      className={className || 'border rounded px-2 py-1'}
    />
  ) : (
    <span
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
      aria-label={ariaLabel}
      className={className || 'cursor-pointer underline'}
      style={{ cursor: 'pointer' }}
    >
      {value}
    </span>
  );
}
