import React from 'react';

export default function DashboardSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="mb-8">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-64 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-gray-200 mb-4"></div>
                                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
