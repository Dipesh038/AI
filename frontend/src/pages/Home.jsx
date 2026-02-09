import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CountrySelector from '../components/CountrySelector';
import Graph from '../components/Graph';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

const Home = () => {
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('India');
    const [countryData, setCountryData] = useState(null);
    // const [tools, setTools] = useState([]); // Removed high-memory state
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(2024);
    const [trendingYear, setTrendingYear] = useState(2024);
    const [pieYear, setPieYear] = useState(2025);

    const [popularityData, setPopularityData] = useState([]);
    const [growthData, setGrowthData] = useState([]);
    const [pieData, setPieData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const countriesRes = await api.get('/countries');
                setCountries(countriesRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch Popularity Data
    useEffect(() => {
        const fetchPopularity = async () => {
            if (selectedCountry && selectedYear) {
                try {
                    const res = await api.get(`/analytics/popularity?country=${selectedCountry}&year=${selectedYear}&limit=10`);
                    const formattedData = res.data.map(item => ({
                        name: item.toolName,
                        usage: item.popularity
                    }));
                    setPopularityData(formattedData);
                } catch (error) {
                    console.error('Error fetching popularity:', error);
                    setPopularityData([]);
                }
            }
        };
        fetchPopularity();
    }, [selectedCountry, selectedYear]);

    // Fetch Growth Data
    useEffect(() => {
        const fetchGrowth = async () => {
            try {
                const res = await api.get(`/analytics/growth?year=${trendingYear}&limit=5`);
                setGrowthData(res.data);
            } catch (error) {
                console.error('Error fetching growth data:', error);
                setGrowthData([]);
            }
        };
        fetchGrowth();
    }, [trendingYear]);

    useEffect(() => {
        if (selectedCountry) {
            const fetchCountryData = async () => {
                try {
                    const res = await api.get(`/countries/${selectedCountry}`);
                    setCountryData(res.data);
                } catch (error) {
                    console.error('Error fetching country data:', error);
                    setCountryData(null);
                }
            };
            fetchCountryData();
        } else {
            setCountryData(null);
        }
    }, [selectedCountry]);

    // Fetch Category Distribution
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get(`/analytics/categories?year=${pieYear}`);
                // API returns { name, value } derived from count
                // Backend already sorts by count desc
                const top5 = res.data.slice(0, 5);
                const othersCount = res.data.slice(5).reduce((acc, item) => acc + item.value, 0);

                const finalData = [...top5];
                if (othersCount > 0) {
                    finalData.push({ name: 'Others', value: othersCount });
                }
                setPieData(finalData);
            } catch (error) {
                console.error('Error fetching category stats:', error);
                setPieData([]);
            }
        };
        fetchCategories();
    }, [pieYear]);

    if (loading) return <div className="p-10 text-white">Loading...</div>;

    const displayData = popularityData;

    // Calculate Category Distribution (Top 5 + Others)


    const totalToolsInYear = pieData.reduce((acc, entry) => acc + entry.value, 0);

    const trendingTools = growthData;

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
                <h1 className="text-2xl font-bold mb-6 text-white">Global AI Trends</h1>

                {/* AI Readiness Card */}
                {countryData && (
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
                )}

                <CountrySelector
                    countries={countries}
                    selectedCountry={selectedCountry}
                    onSelect={setSelectedCountry}
                />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-[#1e1e2e] p-6 rounded-2xl shadow-lg border border-gray-700/30 relative">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-semibold text-gray-100">
                            {selectedCountry ? `${selectedCountry} - Tool Popularity` : 'Select a Country'}
                        </h2>

                        {/* Year Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="appearance-none bg-slate-800 border border-slate-700 text-white py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium cursor-pointer"
                            >
                                <option value={2024}>2024</option>
                                <option value={2025}>2025</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="h-[400px]">
                        <Graph data={displayData} />
                    </div>
                </div>

                {/* Insights Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* AI Tools by Category (Distribution) */}
                    <div className="bg-[#1e1e2e] p-6 rounded-2xl shadow-lg border border-gray-700/30 flex flex-col">
                        <div className="mb-4 flex justifying-between items-start">
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-white mb-2">AI Tools by Category ({pieYear})</h2>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Distribution of AI tools launched or active in {pieYear}.
                                </p>
                            </div>

                            {/* Year Dropdown */}
                            <div className="relative ml-4">
                                <select
                                    value={pieYear}
                                    onChange={(e) => setPieYear(parseInt(e.target.value))}
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

                        <div className="flex-1 flex flex-col md:flex-row items-center justify-center">
                            <div className="h-64 w-full md:w-1/2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px' }}
                                            itemStyle={{ color: '#f1f5f9' }}
                                            formatter={(value) => [`${value} tools`, 'Count']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
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

                        <div className="mt-6 pt-4 border-t border-gray-700/30">
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 mb-2">
                                <p className="text-xs font-medium text-blue-300 mb-1">💡 Key Insight</p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {pieData.length > 0 && `${pieData[0].name} tools represent the largest share (${Math.round((pieData[0].value / totalToolsInYear) * 100)}%) of tools from ${pieYear}, indicating strong market focus on ${pieData[0].name.toLowerCase()} solutions.`}
                                </p>
                            </div>
                            <p className="text-xs text-gray-500 text-center">While popularity shows <em>which tools</em> are used and trending shows <em>which are growing</em>, this reveals <em>what types</em> of tools dominate the ecosystem.</p>
                        </div>
                    </div>

                    {/* Fastest Growing AI Tools (YoY) */}
                    <div className="bg-[#1e1e2e] p-6 rounded-2xl shadow-lg border border-gray-700/30 flex flex-col">
                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-1">Fastest Growing AI Tools – {trendingYear} (YoY)</h2>
                                <p className="text-sm text-gray-400">Year-over-year growth comparison for {trendingYear}</p>
                            </div>

                            {/* Year Dropdown */}
                            <div className="relative">
                                <select
                                    value={trendingYear}
                                    onChange={(e) => setTrendingYear(parseInt(e.target.value))}
                                    className="appearance-none bg-slate-800 border border-slate-700 text-white py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium cursor-pointer"
                                >
                                    <option value={2024}>2024</option>
                                    <option value={2025}>2025</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            {trendingTools.map((tool, index) => (
                                <div key={tool._id} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:bg-slate-800/60 transition-colors group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs ring-1 ring-blue-500/20 group-hover:bg-blue-500/20 group-hover:ring-blue-500/40 transition-all">
                                            {tool.rank || index + 1}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-200 block">{tool.toolName}</span>
                                            <span className="text-xs text-slate-500">{tool.category}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        {tool.growthPercent}%
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-700/30 text-center">
                            <p className="text-xs text-gray-500">Growth values are estimated based on publicly observed trends and adoption signals.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
