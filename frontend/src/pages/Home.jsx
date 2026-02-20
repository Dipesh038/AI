import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import axios from 'axios';
import api from '../services/api';
import CountrySelector from '../components/CountrySelector';
// Graph lazy-loaded below — keeps recharts off the critical path
import { DashboardSkeleton } from '../components/SkeletonLoader';

// Lazy-load Graph so recharts (522 KB) is fully excluded from the initial bundle
const Graph = React.lazy(() => import('../components/Graph'));

// Lazy-load Recharts so it is excluded from the initial JS bundle
const LazyDonutChart = React.lazy(() =>
    import('recharts').then(mod => ({
        default: ({ data, colors }) => (
            <mod.ResponsiveContainer width="100%" height="100%">
                <mod.PieChart>
                    <mod.Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <mod.Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="none" />
                        ))}
                    </mod.Pie>
                    <mod.Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px' }}
                        itemStyle={{ color: '#f1f5f9' }}
                        formatter={(value) => [`${value} tools`, 'Count']}
                    />
                </mod.PieChart>
            </mod.ResponsiveContainer>
        )
    }))
);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

const Home = () => {
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('India');
    const [countryData, setCountryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(2025);
    const [pieYear, setPieYear] = useState(2025);

    const [popularityData, setPopularityData] = useState([]);
    const [pieData, setPieData] = useState([]);

    // AbortController refs for request cancellation
    const popularityAbortRef = useRef(null);
    const countryAbortRef = useRef(null);
    const pieAbortRef = useRef(null);

    // Debounce refs
    const countryDebounceRef = useRef(null);
    const pieDebounceRef = useRef(null);

    // --- Initial load: fetch countries + default data in parallel ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [countriesRes, popularityRes, categoriesRes, countryDetailRes] = await Promise.all([
                    api.get('/countries'),
                    api.get('/analytics/popularity?country=India&year=2025&limit=10'),
                    api.get('/analytics/categories?year=2025'),
                    api.get('/countries/India')
                ]);

                setCountries(countriesRes.data);
                setPopularityData(popularityRes.data.map(item => ({
                    name: item.toolName,
                    usage: item.popularity
                })));
                setCountryData(countryDetailRes.data);

                // Process pie data
                const top5 = categoriesRes.data.slice(0, 5);
                const othersCount = categoriesRes.data.slice(5).reduce((acc, item) => acc + item.value, 0);
                const finalData = [...top5];
                if (othersCount > 0) finalData.push({ name: 'Others', value: othersCount });
                setPieData(finalData);
            } catch (error) {
                if (!axios.isCancel(error)) {
                    console.error('Error fetching initial data:', error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // --- Debounced Popularity fetch (on country/year change, skip first render) ---
    const isInitialRender = useRef(true);

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        // Cancel previous request
        if (popularityAbortRef.current) popularityAbortRef.current.abort();
        if (countryAbortRef.current) countryAbortRef.current.abort();

        // Debounce 300ms
        clearTimeout(countryDebounceRef.current);
        countryDebounceRef.current = setTimeout(async () => {
            if (!selectedCountry || !selectedYear) return;

            const popController = new AbortController();
            const countryController = new AbortController();
            popularityAbortRef.current = popController;
            countryAbortRef.current = countryController;

            try {
                const [popRes, countryRes] = await Promise.all([
                    api.get(`/analytics/popularity?country=${selectedCountry}&year=${selectedYear}&limit=10`, {
                        signal: popController.signal
                    }),
                    api.get(`/countries/${selectedCountry}`, {
                        signal: countryController.signal
                    })
                ]);

                setPopularityData(popRes.data.map(item => ({
                    name: item.toolName,
                    usage: item.popularity
                })));
                setCountryData(countryRes.data);
            } catch (error) {
                if (!axios.isCancel(error)) {
                    console.error('Error fetching popularity:', error);
                    setPopularityData([]);
                }
            }
        }, 300);

        return () => clearTimeout(countryDebounceRef.current);
    }, [selectedCountry, selectedYear]);

    // --- Debounced Pie chart fetch ---
    const isInitialPie = useRef(true);

    useEffect(() => {
        if (isInitialPie.current) {
            isInitialPie.current = false;
            return;
        }

        if (pieAbortRef.current) pieAbortRef.current.abort();

        clearTimeout(pieDebounceRef.current);
        pieDebounceRef.current = setTimeout(async () => {
            const controller = new AbortController();
            pieAbortRef.current = controller;

            try {
                const res = await api.get(`/analytics/categories?year=${pieYear}`, {
                    signal: controller.signal
                });
                const top5 = res.data.slice(0, 5);
                const othersCount = res.data.slice(5).reduce((acc, item) => acc + item.value, 0);
                const finalData = [...top5];
                if (othersCount > 0) finalData.push({ name: 'Others', value: othersCount });
                setPieData(finalData);
            } catch (error) {
                if (!axios.isCancel(error)) {
                    console.error('Error fetching category stats:', error);
                    setPieData([]);
                }
            }
        }, 300);

        return () => clearTimeout(pieDebounceRef.current);
    }, [pieYear]);

    // --- Memoized values ---
    const displayData = useMemo(() => popularityData, [popularityData]);

    const totalToolsInYear = useMemo(
        () => pieData.reduce((acc, entry) => acc + entry.value, 0),
        [pieData]
    );

    // --- Memoized callbacks ---
    const handleCountrySelect = useCallback((country) => {
        setSelectedCountry(country);
    }, []);

    const handleYearChange = useCallback((e) => {
        setSelectedYear(parseInt(e.target.value));
    }, []);

    const handlePieYearChange = useCallback((e) => {
        setPieYear(parseInt(e.target.value));
    }, []);

    // --- Loading skeleton - Only if critical data is missing (e.g. countries) ---
    if (loading && countries.length === 0) return <DashboardSkeleton />;

    return (
        <div id="main-content" className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
                <h1 className="text-2xl font-bold mb-6 text-white">Global AI Trends</h1>

                {/* AI Readiness Card */}
                {countryData ? (
                    <div className="mb-6 grid grid-cols-3 gap-4 border-b border-slate-700 pb-6">
                        <div className="text-center">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">AI Index Score</p>
                            <p className="text-2xl font-bold text-blue-400">{countryData.aiIndexScore || 'N/A'}</p>
                        </div>
                        <div className="text-center border-l border-slate-700">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Global Rank</p>
                            <p className="text-2xl font-bold text-white">
                                {countryData.globalRank && countryData.globalRank > 0 ? `#${countryData.globalRank}` : 'Rank unavailable'}
                            </p>
                        </div>
                        <div className="text-center border-l border-slate-700">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Adoption</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-sm font-medium ${countryData.adoptionLevel === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                                countryData.adoptionLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                }`}>
                                {countryData.adoptionLevel || 'Unknown'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 h-20 animate-pulse bg-slate-800 rounded-lg"></div>
                )}

                <CountrySelector
                    countries={countries}
                    selectedCountry={selectedCountry}
                    onSelect={handleCountrySelect}
                />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-gray-700/30 relative magic-bento">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-semibold text-gray-100">
                            {selectedCountry ? `${selectedCountry} - Tool Popularity` : 'Select a Country'}
                        </h2>

                        {/* Year Dropdown */}
                        <div className="relative">
                            <select
                                aria-label="Select Tool Popularity Year"
                                value={selectedYear}
                                onChange={handleYearChange}
                                className="appearance-none bg-slate-800 border border-slate-700 text-white py-2 pl-4 pr-10 rounded-lg shadow-sm text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-violet-600/35 hover:to-blue-500/35 hover:border-blue-500/40 focus:bg-gradient-to-r focus:from-violet-600/45 focus:to-blue-500/45 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50"
                            >
                                <option value={2025}>2025</option>
                                <option value={2024}>2024</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="h-[400px]">
                        <Suspense fallback={<div className="h-full animate-pulse bg-white/5 rounded-xl" />}>
                            <Graph data={displayData} />
                        </Suspense>
                    </div>
                </div>

                {/* Insights Section */}
                <div className="grid grid-cols-1 gap-6">

                    {/* AI Tools by Category (Distribution) */}
                    <div className="bg-slate-900 p-5 rounded-2xl shadow-lg border border-gray-700/30 flex flex-col">
                        <div className="mb-2 flex justify-end">
                            {/* Year Dropdown */}
                            <div className="relative">
                                <select
                                    aria-label="Select Category Distribution Year"
                                    value={pieYear}
                                    onChange={handlePieYearChange}
                                    className="appearance-none bg-slate-800 border border-slate-700 text-white py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium cursor-pointer"
                                >
                                    {[2022, 2023, 2024, 2025].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 pt-2 flex flex-col md:flex-row items-center justify-center">
                            <div className="h-64 w-full md:w-1/2">
                                <Suspense fallback={<div className="h-full w-full animate-pulse bg-white/5 rounded-xl" />}>
                                    <LazyDonutChart data={pieData} colors={COLORS} />
                                </Suspense>
                            </div>

                            {/* Custom Legend */}
                            <div className="w-full md:w-1/2 pl-0 md:pl-6 mt-4 md:mt-0 space-y-3">
                                {pieData.map((entry, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center">
                                            <div
                                                className="w-3 h-3 rounded-full mr-3"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="text-gray-300">{entry.name}</span>
                                        </div>
                                        <span className="font-medium text-gray-400">
                                            {Math.round((entry.value / totalToolsInYear) * 100)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
