import React from 'react';

// Base shimmer animation using Tailwind's animate-pulse
const Shimmer = ({ className = '' }) => (
    <div className={`bg-slate-700/50 rounded animate-pulse ${className}`} />
);

// Dashboard skeleton for Home page
export const DashboardSkeleton = () => (
    <div className="space-y-6">
        {/* AI Readiness Card */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <Shimmer className="h-7 w-48 mb-6" />
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-700">
                {[1, 2, 3].map(i => (
                    <div key={i} className="text-center space-y-2">
                        <Shimmer className="h-3 w-20 mx-auto" />
                        <Shimmer className="h-8 w-16 mx-auto" />
                    </div>
                ))}
            </div>
            <Shimmer className="h-10 w-full rounded-xl" />
        </div>

        {/* Chart Area */}
        <div className="bg-[#1e1e2e] p-6 rounded-2xl border border-gray-700/30">
            <div className="flex justify-between mb-6">
                <Shimmer className="h-6 w-56" />
                <Shimmer className="h-10 w-24 rounded-lg" />
            </div>
            <div className="h-[400px] space-y-6 pt-8">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Shimmer className="h-4 w-24" />
                        <Shimmer className="h-6 rounded-full" style={{ width: `${85 - i * 10}%` }} />
                    </div>
                ))}
            </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(card => (
                <div key={card} className="bg-[#1e1e2e] p-6 rounded-2xl border border-gray-700/30">
                    <div className="flex justify-between mb-6">
                        <div className="space-y-2">
                            <Shimmer className="h-5 w-44" />
                            <Shimmer className="h-3 w-64" />
                        </div>
                        <Shimmer className="h-10 w-24 rounded-lg" />
                    </div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Shimmer key={i} className="h-16 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Catalog skeleton with card grid
export const CatalogSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-[#1e1e2e] p-5 rounded-2xl border border-gray-700/30 space-y-4">
                <div className="flex justify-between">
                    <Shimmer className="h-5 w-32" />
                    <Shimmer className="h-5 w-16 rounded-full" />
                </div>
                <Shimmer className="h-3 w-full" />
                <Shimmer className="h-3 w-3/4" />
                <div className="flex justify-between pt-2">
                    <Shimmer className="h-4 w-20" />
                    <Shimmer className="h-4 w-16" />
                </div>
            </div>
        ))}
    </div>
);

// Chart-only skeleton
export const ChartSkeleton = () => (
    <div className="h-[400px] space-y-6 pt-8">
        {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
                <Shimmer className="h-4 w-24" />
                <Shimmer className="h-6 rounded-full" style={{ width: `${85 - i * 10}%` }} />
            </div>
        ))}
    </div>
);
