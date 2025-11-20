// src/app/dashboard/settings/page.tsx
'use client';

import { useState, Fragment } from 'react';
import { useToast } from '@/app/components/HelperComponents';

export default function SettingsPage() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const { showToast, Toast } = useToast();

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme);
    // In a real app, you would save this preference to localStorage or a database
    // and apply a 'dark' class to the <html> element.
    showToast(`Theme changed to ${!isDarkTheme ? 'Dark' : 'Light'}`, 'success');
  };

  return (
    <Fragment>
      <Toast />
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-lg text-gray-600 mt-1">Customize your portal experience.</p>
      </header>

      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <p className="text-gray-700">Dark Theme</p>
          <button
            onClick={handleThemeToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
              isDarkTheme ? 'bg-purple-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                isDarkTheme ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">Note: This is a visual toggle for now. Full theme functionality will be added later.</p>
      </section>
    </Fragment>
  );
}
