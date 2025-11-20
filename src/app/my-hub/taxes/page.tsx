'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chart, DoughnutController, ArcElement, Legend, Tooltip } from 'chart.js';

// Register the necessary components for Chart.js
Chart.register(DoughnutController, ArcElement, Legend, Tooltip);

// Define the structure for a single pot
interface Pot {
    name: string;
    percentage: number;
    color: string;
}

export default function PotCalculatorPage() {
    // State for the gross income input
    const [income, setIncome] = useState<number>(0);
    
    // State to hold the definitions of all the pots
    const [pots, setPots] = useState<Pot[]>([
        { name: 'Tax & NI', percentage: 50, color: '#ef4444' }, // Red
        { name: 'Pension', percentage: 10, color: '#3b82f6' }, // Blue
        { name: 'Holiday Pay', percentage: 5, color: '#22c55e' }, // Green
        { name: 'Sick Pay', percentage: 2, color: '#eab308' }, // Yellow
        { name: 'Outgoings', percentage: 10, color: '#6366f1' }, // Indigo
        { name: 'Profit', percentage: 3, color: '#d946ef' }, // Fuchsia
        { name: 'Your Pay', percentage: 20, color: '#14b8a6' }, // Teal
    ]);

    // Refs for the chart instance and canvas element
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    // Function to handle changes in the percentage inputs
    const handlePercentageChange = (index: number, value: string) => {
        const newPercentage = Number(value);
        const newPots = [...pots];
        newPots[index].percentage = newPercentage;
        setPots(newPots);
    };
    
    // Calculate the total percentage to check if it exceeds 100
    const totalPercentage = pots.reduce((sum, pot) => sum + pot.percentage, 0);

    // Effect hook to create and update the chart whenever the income or pot percentages change
    useEffect(() => {
        if (chartRef.current) {
            // Destroy the previous chart instance if it exists
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
            
            // Don't render the chart if the total percentage is over 100
            if (totalPercentage > 100) {
                return;
            }

            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: pots.map(p => p.name),
                        datasets: [{
                            data: pots.map(p => (income * p.percentage) / 100),
                            backgroundColor: pots.map(p => p.color),
                            borderColor: '#ffffff',
                            borderWidth: 2,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 15,
                                    font: {
                                        size: 14,
                                    },
                                    color: '#1f2937'
                                }
                            }
                        }
                    }
                });
            }
        }
        // Cleanup function to destroy the chart when the component unmounts
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [income, pots, totalPercentage]);

    return (
        <div className="bg-gray-100 text-gray-800 min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-4xl">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Self-Employed Pot Calculator</h1>
                    <p className="text-lg text-gray-600 mt-2">Instantly see how to allocate your income.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    
                    {/* Left Side: Input & Controls */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4">Enter Your Income</h2>
                        <div className="mb-6">
                            <label htmlFor="income" className="block text-sm font-medium text-gray-700 mb-1">Gross Income (£)</label>
                            <input 
                                type="number" 
                                id="income" 
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                                placeholder="e.g., 1000"
                                onChange={(e) => setIncome(Number(e.target.value))}
                            />
                        </div>

                        <h3 className="text-xl font-semibold mb-4">Pot Percentages</h3>
                        <div className="space-y-4">
                           {pots.map((pot, index) => (
                               <div key={pot.name} className="flex items-center justify-between">
                                   <label htmlFor={`pot-${index}`} className="text-gray-700">{pot.name}</label>
                                   <div className="flex items-center w-24">
                                       <input 
                                           type="number" 
                                           id={`pot-${index}`} 
                                           value={pot.percentage} 
                                           onChange={(e) => handlePercentageChange(index, e.target.value)}
                                           className="w-full p-1 border border-gray-300 rounded-md text-right"
                                       />
                                       <span className="ml-2 text-gray-500">%</span>
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>

                    {/* Right Side: Results & Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4 text-center">Your Pots Breakdown</h2>
                        
                        {totalPercentage > 100 ? (
                            <p className="text-red-500 text-center font-bold">Total percentage cannot exceed 100%!</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                                    {pots.map(pot => {
                                        const amount = (income * pot.percentage) / 100;
                                        return (
                                            <div key={pot.name} className="p-3 rounded-lg flex justify-between items-center" style={{ backgroundColor: `${pot.color}20` }}>
                                                <span className="font-semibold" style={{ color: pot.color }}>{pot.name}</span>
                                                <span className="font-bold text-lg text-gray-800">£{amount.toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="relative mx-auto h-96 w-full max-w-sm">
                                    <canvas ref={chartRef}></canvas>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
