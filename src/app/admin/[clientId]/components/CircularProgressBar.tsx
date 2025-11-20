'use client';

import React from 'react';

// Type alias for the component props
type Props = {
    completed: number;
    total: number;
    size?: number;
    strokeWidth?: number;
};

// This component displays a circular progress bar for milestones.
export const CircularProgressBar = ({ completed, total, size = 100, strokeWidth = 10 }: Props) => {
    const radius: number = (size - strokeWidth) / 2;
    const circumference: number = radius * 2 * Math.PI;
    const progress: number = total > 0 ? (completed / total) : 0;
    const offset: number = circumference - progress * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    stroke="#e5e7eb" // gray-200
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className="transition-all duration-700 ease-out"
                    stroke="#7c3aed" // purple-600
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
                <p className="text-xl font-bold text-purple-700">{completed}<span className="text-lg text-gray-500">/{total}</span></p>
                <p className="text-sm font-medium text-gray-600 tracking-wider">MILESTONES</p>
            </div>
        </div>
    );
};
