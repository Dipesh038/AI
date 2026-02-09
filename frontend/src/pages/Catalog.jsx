import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ToolList from '../components/ToolList';
import ToolDetailsDrawer from '../components/ToolDetailsDrawer';
import { Search, Filter } from 'lucide-react';

const Catalog = () => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState(['All']);
    const [selectedTool, setSelectedTool] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/tools/categories');
                setCategories(['All', ...res.data]);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Fetch Tools
    useEffect(() => {
        const fetchTools = async () => {
            setLoading(true);
            try {
                const params = {
                    page,
                    limit: 12, // Reduced limit for better card layout
                    search: debouncedSearch,
                    category: selectedCategory !== 'All' ? selectedCategory : undefined
                };

                const res = await api.get('/tools', { params });

                setTools(res.data.tools);
                setTotalPages(res.data.totalPages);

                // If we want dynamic categories, we'd need a separate endpoint or just stick to static for now
                // setCategories(['All', ...new Set(res.data.tools.map(t => t.category))]); 
            } catch (error) {
                console.error('Error fetching tools:', error);
                setTools([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTools();
    }, [page, debouncedSearch, selectedCategory]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedCategory]);

    const handleToolSelect = (tool) => {
        setSelectedTool(tool);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
                <h1 className="text-2xl font-bold mb-4 text-white">AI Tools Catalog</h1>
                <p className="text-gray-400 mb-6">Browse the complete collection of AI tools tracked by our platform.</p>

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 text-white pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="relative w-full md:w-64">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-slate-800 text-white pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading tools...</p>
                </div>
            ) : (
                <>
                    <ToolList
                        tools={tools}
                        onToolSelect={handleToolSelect}
                        selectedTool={selectedTool}
                    />

                    {/* Pagination Controls */}
                    {tools.length > 0 && (
                        <div className="flex justify-center items-center space-x-4 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className={`px-4 py-2 rounded-lg border ${page === 1 ? 'border-gray-700 text-gray-600 cursor-not-allowed' : 'border-slate-600 text-gray-300 hover:bg-slate-800'}`}
                            >
                                Previous
                            </button>
                            <span className="text-gray-400">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className={`px-4 py-2 rounded-lg border ${page === totalPages ? 'border-gray-700 text-gray-600 cursor-not-allowed' : 'border-slate-600 text-gray-300 hover:bg-slate-800'}`}
                            >
                                Next
                            </button>
                        </div>
                    )}

                    {tools.length === 0 && (
                        <div className="text-center py-20 text-gray-500">
                            No tools found matching your criteria.
                        </div>
                    )}
                </>
            )}

            <ToolDetailsDrawer
                tool={selectedTool}
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                tools={tools}
                onToolSelect={handleToolSelect}
            />
        </div>
    );
};

export default Catalog;
