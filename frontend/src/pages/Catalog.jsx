import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import api from '../services/api';
import ToolList from '../components/ToolList';
import ToolDetailsDrawer from '../components/ToolDetailsDrawer';
import { CatalogSkeleton } from '../components/SkeletonLoader';
import { Search, Filter, Command } from 'lucide-react';

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

    // AbortController ref for fetch cancellation
    const abortRef = useRef(null);

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

    // Fetch Tools with AbortController
    useEffect(() => {
        // Cancel previous request
        if (abortRef.current) abortRef.current.abort();

        const controller = new AbortController();
        abortRef.current = controller;

        const fetchTools = async () => {
            setLoading(true);
            try {
                const params = {
                    page,
                    limit: 12,
                    search: debouncedSearch,
                    category: selectedCategory !== 'All' ? selectedCategory : undefined
                };

                const res = await api.get('/tools', { params, signal: controller.signal });

                setTools(res.data.tools);
                setTotalPages(res.data.totalPages);
            } catch (error) {
                if (!axios.isCancel(error)) {
                    console.error('Error fetching tools:', error);
                    setTools([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchTools();

        return () => controller.abort();
    }, [page, debouncedSearch, selectedCategory]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedCategory]);

    const handleToolSelect = useCallback((tool) => {
        setSelectedTool(tool);
        setIsDrawerOpen(true);
    }, []);

    const handleCloseDrawer = useCallback(() => {
        setIsDrawerOpen(false);
    }, []);

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">AI Tools Catalog</h1>
                    <p className="text-gray-400 text-base">Browse the complete collection of AI tools tracked by our platform.</p>
                </div>
            </div>

            {/* Floating Glass Search & Filter Bar */}
            <div className="sticky top-4 z-40 bg-[#0B0F19]/70 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3 transition-all duration-300 hover:border-white/20 hover:shadow-blue-900/10 hover:shadow-2xl">
                {/* Search Input */}
                <div className="relative flex-1 group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search tools..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-white pl-12 pr-14 py-3.5 rounded-xl border border-transparent focus:bg-white/5 focus:border-white/10 focus:outline-none transition-all placeholder:text-gray-600"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden md:flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/5 text-xs text-gray-500 font-mono">
                        <Command size={10} />
                        <span>K</span>
                    </div>
                </div>

                {/* Divider (Desktop) */}
                <div className="hidden md:block w-px bg-white/10 my-2"></div>

                {/* Filter Dropdown */}
                <div className="relative min-w-[200px] group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors">
                        <Filter size={20} />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-transparent text-white pl-12 pr-10 py-3.5 rounded-xl border border-transparent focus:bg-white/5 focus:border-white/10 focus:outline-none appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {loading ? (
                <CatalogSkeleton />
            ) : (
                <>
                    <ToolList
                        tools={tools}
                        onToolSelect={handleToolSelect}
                        selectedTool={selectedTool}
                    />

                    {/* Pagination Controls */}
                    {tools.length > 0 && (
                        <div className="flex justify-center items-center space-x-4 mt-12">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className={`px-6 py-2.5 rounded-xl border transition-all duration-300 font-medium
                                ${page === 1
                                        ? 'border-white/5 text-gray-600 cursor-not-allowed'
                                        : 'border-white/10 text-gray-300 hover:bg-white/5 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                Previous
                            </button>
                            <span className="text-gray-400 font-mono text-sm px-4">
                                Page <span className="text-white font-bold">{page}</span> of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className={`px-6 py-2.5 rounded-xl border transition-all duration-300 font-medium
                                ${page === totalPages
                                        ? 'border-white/5 text-gray-600 cursor-not-allowed'
                                        : 'border-white/10 text-gray-300 hover:bg-white/5 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    )}

                    {tools.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Search size={32} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No tools found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
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
