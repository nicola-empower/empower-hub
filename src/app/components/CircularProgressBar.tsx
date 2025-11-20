// src/app/components/CircularProgressBar.tsx
'use client';

import React from 'react';

type Props = {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
};

// This component displays a circular progress bar for milestones.
export const CircularProgressBar = ({ completed, total, size = 120, strokeWidth = 12 }: Props) => {
  const radius: number = (size - strokeWidth) / 2;
  const circumference: number = radius * 2 * Math.PI;
  const progress: number = total > 0 ? (completed / total) : 0;
  const offset: number = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Circle */}
        <circle
          stroke="#e5e7eb" // gray-200
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Circle */}
        <circle
          className="transition-all duration-700 ease-in-out"
          stroke="#8b5cf6" // purple-500
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold text-purple-700">
          {completed}<span className="text-xl text-gray-500">/{total}</span>
        </p>
        <p className="text-xs font-medium text-gray-500 tracking-wider uppercase">Milestones</p>
      </div>
    </div>
  );
};