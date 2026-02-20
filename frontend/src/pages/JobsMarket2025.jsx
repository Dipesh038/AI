import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import api from '../services/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { TrendingUp, Search, Briefcase, GraduationCap, Zap, ArrowUpRight, Globe } from 'lucide-react';

const remoteColors = {
    Remote: '#22d3ee', // Cyan-400
    Hybrid: '#a78bfa', // Purple-400
    'On-site': '#94a3b8' // Slate-400
};

// Glassmorphism Styles
const glassCardClass =
    'relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900/40 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-cyan-500/30 hover:shadow-cyan-500/10 group';

const glassPanelClass =
    'rounded-2xl border border-white/5 bg-[#0B0F19]/60 backdrop-blur-2xl shadow-2xl';

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);

const defaultFilters = {
    jobTitle: '',
    experienceLevel: 'All',
    country: 'All'
};

const buildParams = (filters) => {
    const params = {};
    if (filters.jobTitle.trim()) params.job_title = filters.jobTitle.trim();
    if (filters.experienceLevel !== 'All') params.experience_level = filters.experienceLevel;
    if (filters.country !== 'All') params.country = filters.country;
    return params;
};

const JobsMarket2025 = () => {
    const [draftFilters, setDraftFilters] = useState(defaultFilters);
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
    const [suggestions, setSuggestions] = useState([]);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const [insights, setInsights] = useState({
        averageSalaryUsd: null,
        topSkills: [],
        minimumEducationRequired: 'Not specified',
        totalMatches: 0
    });
    const [globalSalaryData, setGlobalSalaryData] = useState([]);
    const [highlightedCategory, setHighlightedCategory] = useState(null);
    const [remoteTrends, setRemoteTrends] = useState([]);

    const [loadingBasic, setLoadingBasic] = useState(true);
    const [error, setError] = useState('');

    const filterParams = useMemo(() => buildParams(appliedFilters), [appliedFilters]);

    // Check if there is an active search that requires highlighting
    const hasActiveSearch = useMemo(() => {
        return appliedFilters.jobTitle.trim().length > 0;
    }, [appliedFilters.jobTitle]);

    // Suggestion Logic
    const shouldShowSuggestions =
        isInputFocused &&
        draftFilters.jobTitle.trim().length >= 2 &&
        (loadingSuggestions || suggestions.length > 0);

    useEffect(() => {
        const controller = new AbortController();

        const fetchBasicData = async () => {
            setLoadingBasic(true);
            setError('');
            setHighlightedCategory(null); // Reset highlight on new fetch

            try {
                // 1. Fetch Global Data (Unfiltered) for Context
                // We always want the full market view for the charts
                const [globalSalaryRes, remoteRes] = await Promise.all([
                    api.get('/jobs/salary-by-category', { signal: controller.signal }), // No params = global
                    api.get('/jobs/remote-trends', { params: filterParams, signal: controller.signal }) // Respects filters
                ]);

                // 2. Fetch Specific Insights (Filtered)
                // If searching, this gives us the specific numbers for the cards
                const insightsRes = await api.get('/jobs/insights', { params: filterParams, signal: controller.signal });

                setInsights({
                    averageSalaryUsd: insightsRes.data.averageSalaryUsd,
                    topSkills: insightsRes.data.topSkills || [],
                    minimumEducationRequired: insightsRes.data.minimumEducationRequired || 'Not specified',
                    totalMatches: insightsRes.data.totalMatches || 0
                });

                // Set Global Salary Data
                setGlobalSalaryData((globalSalaryRes.data.categories || []).slice(0, 8));

                // 3. Identify Highlighted Category if Searching
                if (hasActiveSearch) {
                    // We fetch the 'salary-by-category' AGAIN with filters to see which category represents this job
                    const specificCategoryRes = await api.get('/jobs/salary-by-category', {
                        params: filterParams,
                        signal: controller.signal
                    });

                    const categories = specificCategoryRes.data.categories || [];
                    if (categories.length > 0) {
                        // The top category returned for this specific job title is likely the one we want to highlight
                        setHighlightedCategory(categories[0].job_category);
                    }
                }

                // Process remote trends for donut chart
                const total = (remoteRes.data.trends || []).reduce((acc, curr) => acc + curr.count, 0);
                const processedRemote = (remoteRes.data.trends || []).map(item => ({
                    ...item,
                    percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
                }));
                setRemoteTrends(processedRemote);

            } catch (err) {
                if (!axios.isCancel(err)) setError('Unable to load trend data right now.');
            } finally {
                if (!controller.signal.aborted) setLoadingBasic(false);
            }
        };

        fetchBasicData();
        return () => controller.abort();
    }, [filterParams, hasActiveSearch]);

    useEffect(() => {
        const query = draftFilters.jobTitle.trim();
        if (query.length < 2) {
            setSuggestions([]);
            setLoadingSuggestions(false);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoadingSuggestions(true);
            try {
                const { data } = await api.get('/jobs/suggestions', {
                    params: { q: query, limit: 8 },
                    signal: controller.signal
                });
                setSuggestions(data.suggestions || []);
            } catch (err) {
                if (!axios.isCancel(err)) {
                    setSuggestions([]);
                }
            } finally {
                if (!controller.signal.aborted) setLoadingSuggestions(false);
            }
        }, 220);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [draftFilters.jobTitle]);

    const handleSuggestionSelect = (value) => {
        const nextFilters = {
            ...defaultFilters,
            jobTitle: value
        };
        setDraftFilters(nextFilters);
        setAppliedFilters(nextFilters);
        setSuggestions([]);
        setIsInputFocused(false);
    };

    return (
        <div className="min-h-screen space-y-8 pb-12 font-sans text-slate-200">
            {/* Ambient Glow Background specifically for this page */}
            <div className="fixed inset-0 pointer-events-none z-[-1]">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/20 blur-[120px]" />
            </div>

            {/* Header Section */}
            <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-1">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        AI Jobs Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Overview</span>
                    </h1>
                    <p className="mt-2 text-slate-400 text-lg">
                        Global AI job market & salary insights (2025)
                    </p>
                </div>

                {/* Smart Search Bar */}
                <div className="relative w-full md:w-96 z-20">
                    <div className={`relative flex items-center overflow-hidden rounded-xl border transition-all duration-300 ${isInputFocused ? 'border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(34,211,238,0.3)] bg-slate-900/80' : 'border-white/10 bg-slate-900/50'}`}>
                        <Search className={`ml-4 h-5 w-5 transition-colors ${isInputFocused ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <input
                            type="text"
                            value={draftFilters.jobTitle}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                            onChange={(e) => {
                                const value = e.target.value;
                                setDraftFilters(prev => ({ ...prev, jobTitle: value }));
                                setAppliedFilters(prev => ({ ...prev, jobTitle: value }));
                            }}
                            placeholder="Search role (e.g. AI Engineer)..."
                            className="w-full bg-transparent px-4 py-3.5 text-white placeholder-slate-500 outline-none"
                        />
                    </div>

                    {shouldShowSuggestions && (
                        <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            {loadingSuggestions ? (
                                <div className="px-4 py-4 text-center text-sm text-slate-400">Loading...</div>
                            ) : (
                                suggestions.map((item, idx) => (
                                    <button
                                        key={`${item.type}-${idx}`}
                                        onMouseDown={() => handleSuggestionSelect(item.label)}
                                        className="flex w-full items-center justify-between border-b border-white/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/5 last:border-0"
                                    >
                                        <span className="font-medium">{item.label}</span>
                                        <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400">
                                            {item.type}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </header>

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-200 flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    {error}
                </div>
            )}

            {/* Insight Cards */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Average Salary */}
                <article className={glassCardClass}>
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="rounded-lg bg-green-500/10 p-2.5 text-green-400">
                                <Briefcase size={24} />
                            </div>
                            {loadingBasic ? (
                                <div className="h-6 w-16 animate-pulse rounded bg-white/5" />
                            ) : (
                                <span className="flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
                                    <ArrowUpRight size={12} />
                                    <span>+12% YoY</span>
                                </span>
                            )}
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-slate-400">Average Annual Salary</h3>
                            <p className="mt-2 text-3xl font-bold text-white tracking-tight">
                                {loadingBasic
                                    ? <span className="animate-pulse">Loading...</span>
                                    : insights.averageSalaryUsd
                                        ? formatCurrency(insights.averageSalaryUsd)
                                        : 'No data'}
                            </p>
                        </div>
                    </div>
                </article>

                {/* Minimum Education */}
                <article className={glassCardClass}>
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400">
                                <GraduationCap size={24} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-slate-400">Minimum Education</h3>
                            <p className="mt-2 text-3xl font-bold text-white tracking-tight truncate">
                                {loadingBasic ? <span className="animate-pulse">Loading...</span> : insights.minimumEducationRequired}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">Most common requirement listed</p>
                        </div>
                    </div>
                </article>

                {/* Top Skills */}
                <article className={glassCardClass}>
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="rounded-lg bg-cyan-500/10 p-2.5 text-cyan-400">
                                <Zap size={24} />
                            </div>
                        </div>
                        <div className="mt-4 h-full">
                            <h3 className="text-sm font-medium text-slate-400">Top In-Demand Skills</h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {loadingBasic ? (
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map(i => <div key={i} className="h-6 w-16 animate-pulse rounded-full bg-white/5" />)}
                                    </div>
                                ) : insights.topSkills.length > 0 ? (
                                    insights.topSkills.slice(0, 5).map((item) => (
                                        <div
                                            key={item.skill}
                                            className="group/skill relative rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-medium text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-400/10 cursor-default"
                                        >
                                            {item.skill}
                                            {/* Tooltip percentage could go here */}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-sm text-slate-500">No skills found</span>
                                )}
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            {/* Main Charts Area */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Bar Chart */}
                <div className={`${glassPanelClass} lg:col-span-2 p-6`}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Salary by Role Category</h3>
                            <p className="text-sm text-slate-400">
                                {loadingBasic ? 'Average annual compensation (USD)' : (
                                    highlightedCategory ? (
                                        <span>
                                            Showing all roles · <strong className="text-cyan-400">{highlightedCategory}</strong> highlighted
                                        </span>
                                    ) : 'Average annual compensation (USD)'
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="h-[320px] w-full">
                        {loadingBasic ? (
                            <div className="flex h-full items-center justify-center text-slate-500 bg-white/5 rounded-xl animate-pulse">Loading Chart...</div>
                        ) : globalSalaryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={globalSalaryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="job_category"
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        angle={-5}
                                        textAnchor="end"
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `$${value / 1000}k`}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const value = payload[0].value;
                                                const isHighlighted = label === highlightedCategory;

                                                // Calculate comparison if needed
                                                // Simple logic: if there is a highlighted category, compare current to it
                                                let comparisonText = null;
                                                if (highlightedCategory && globalSalaryData.length > 0) {
                                                    const highlightedItem = globalSalaryData.find(d => d.job_category === highlightedCategory);
                                                    if (highlightedItem) {
                                                        const pDiff = ((value - highlightedItem.average_salary_usd) / highlightedItem.average_salary_usd) * 100;
                                                        if (label !== highlightedCategory) {
                                                            comparisonText = `${Math.abs(Math.round(pDiff))}% ${pDiff > 0 ? 'more' : 'less'} than ${highlightedCategory}`;
                                                        } else {
                                                            comparisonText = "Highlighting selected role";
                                                        }
                                                    }
                                                }

                                                return (
                                                    <div className={`rounded-xl border ${isHighlighted ? 'border-cyan-500/50 bg-slate-900/95' : 'border-white/10 bg-[#0f172a]/90'} backdrop-blur-xl p-3 shadow-2xl`}>
                                                        <p className="mb-1 text-xs text-slate-400">{label}</p>
                                                        <p className={`text-sm font-bold ${isHighlighted ? 'text-cyan-400' : 'text-white'}`}>
                                                            {formatCurrency(value)}
                                                        </p>
                                                        {comparisonText && (
                                                            <p className="mt-1 text-[10px] text-slate-400 italic">
                                                                {comparisonText}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="average_salary_usd"
                                        radius={[6, 6, 0, 0]}
                                    // Conditional styling for bars
                                    >
                                        {globalSalaryData.map((entry, index) => {
                                            const isHighlighted = entry.job_category === highlightedCategory;
                                            const isMuted = highlightedCategory && !isHighlighted;

                                            // Highlighted: Neon Cyan
                                            // Muted: Low opacity slate
                                            // Default: Standard Cyan gradient

                                            return (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={isHighlighted ? '#22d3ee' : (isMuted ? '#475569' : 'url(#barGradient)')}
                                                    opacity={isMuted ? 0.3 : 1}
                                                    style={{
                                                        filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))' : 'none',
                                                        transition: 'all 0.5s ease'
                                                    }}
                                                />
                                            );
                                        })}
                                    </Bar>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-500">No data available</div>
                        )}
                    </div>
                </div>

                {/* Donut Chart */}
                <div className={`${glassPanelClass} p-6`}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Work Mode</h3>
                            <p className="text-sm text-slate-400">Remote vs On-site distribution</p>
                        </div>
                        <Globe size={18} className="text-slate-500" />
                    </div>
                    <div className="h-[320px] relative">
                        {/* Centered Text Overlay */}
                        {remoteTrends.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-white">
                                    {remoteTrends.find(t => t.type === 'Remote')?.percentage || 0}%
                                </span>
                                <span className="text-xs text-slate-400 uppercase tracking-widest mt-1">Remote</span>
                            </div>
                        )}

                        {loadingBasic ? (
                            <div className="flex h-full items-center justify-center text-slate-500 bg-white/5 rounded-xl animate-pulse">Loading Chart...</div>
                        ) : remoteTrends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={remoteTrends}
                                        dataKey="count"
                                        nameKey="type"
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        stroke="none"
                                    >
                                        {remoteTrends.map((entry) => (
                                            <Cell
                                                key={entry.type}
                                                fill={remoteColors[entry.type] || '#64748b'}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="rounded-xl border border-white/10 bg-[#0f172a]/90 backdrop-blur-xl p-3 shadow-2xl">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-2 h-2 rounded-full" style={{ background: payload[0].fill }} />
                                                            <p className="text-xs text-slate-300">{data.type}</p>
                                                        </div>
                                                        <p className="text-sm font-bold text-white">
                                                            {data.count} <span className="text-xs font-normal text-slate-400">jobs</span>
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-slate-400 text-xs ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-500">No data available</div>
                        )}
                    </div>
                </div>
            </section>

            {/* Career Insight Callout */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 p-8 md:p-12">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300 mb-4">
                        <TrendingUp size={14} />
                        <span>Market Insight</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        AI Engineering roles are shifting towards specialized agents.
                    </h2>
                    <p className="text-lg text-slate-300 mb-6">
                        Data shows a 45% increase in demand for "Agentic AI" and "Multi-modal" skills compared to generic ML roles.
                    </p>
                    <button className="rounded-lg bg-white text-slate-900 px-6 py-3 font-semibold hover:bg-slate-100 transition shadow-lg shadow-white/10" onClick={() => window.open('https://huyenchip.com/2024/07/25/genai-platform.html', '_blank')}>
                        Read Analysis
                    </button>
                </div>
            </section>
        </div>
    );
};

export default JobsMarket2025;
