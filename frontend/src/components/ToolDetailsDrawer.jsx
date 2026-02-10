import React, { useEffect, useRef, useState } from 'react';
import { X, ExternalLink, Calendar, Tag, Globe, TrendingUp, ChevronDown, Check, Search, ChevronUp } from 'lucide-react';

const ToolDetailsDrawer = ({ tool, isOpen, onClose, tools = [], onToolSelect }) => {
    const drawerRef = useRef(null);
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef(null);

    // Navigation Logic
    const currentIndex = tool ? tools.findIndex(t => t._id === tool._id) : -1;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex !== -1 && currentIndex < tools.length - 1;

    const handlePrev = () => {
        if (hasPrev && onToolSelect) {
            onToolSelect(tools[currentIndex - 1]);
        }
    };

    const handleNext = () => {
        if (hasNext && onToolSelect) {
            onToolSelect(tools[currentIndex + 1]);
        }
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            // Ignore if search input is focused
            if (document.activeElement === searchInputRef.current) return;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                handlePrev();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, tool, tools, onToolSelect]); // Re-bind when tool changes to update closure values

    // Focus search input when switcher opens
    useEffect(() => {
        if (isSwitcherOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
        if (!isSwitcherOpen) {
            setSearchTerm(''); // Clear search when closed
        }
    }, [isSwitcherOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            // Lock body scroll when drawer is open
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Close on click outside, but ignore clicks on tool list items
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && drawerRef.current && !drawerRef.current.contains(event.target)) {
                // Check if the click was on a tool trigger (to allow switching without closing)
                if (event.target.closest('.tool-item-trigger')) {
                    return;
                }
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!tool) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        >
            {/* Backdrop Overlay - pointer-events-none allows clicks to pass through to the list for tool switching */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'} pointer-events-none`}
            />

            {/* Application Drawer Panel */}
            <div
                ref={drawerRef}
                className={`
                    relative w-full max-w-lg h-full bg-[#0B0F19]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl 
                    transform transition-transform duration-300 ease-out flex flex-col
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                {/* Close Button & Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="relative">
                        <button
                            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                            className="flex items-center space-x-2 text-xl font-semibold text-white hover:text-blue-400 transition-colors group"
                        >
                            <span className="truncate max-w-[200px]">{tool ? tool.name : 'Tool Details'}</span>
                            <ChevronDown size={20} className={`text-slate-500 group-hover:text-blue-400 transition-transform duration-200 ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isSwitcherOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 max-h-80 overflow-y-auto bg-[#13131f] border border-white/10 rounded-xl shadow-xl z-20 custom-scrollbar flex flex-col">
                                <div className="p-2 sticky top-0 bg-[#13131f] border-b border-white/5 z-10">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Find a tool..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full bg-[#0B0F19] text-white pl-9 pr-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="py-1">
                                    {tools
                                        .filter(t =>
                                            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            t.category.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((t) => (
                                            <button
                                                key={t._id}
                                                onClick={() => {
                                                    if (onToolSelect) onToolSelect(t);
                                                    setIsSwitcherOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-center justify-between group transition-colors"
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-medium ${t._id === tool._id ? 'text-blue-400' : 'text-slate-300 group-hover:text-white'}`}>
                                                        {t.name}
                                                    </span>
                                                    {searchTerm && (
                                                        <span className="text-xs text-slate-500">{t.category}</span>
                                                    )}
                                                </div>
                                                {t._id === tool._id && <Check size={14} className="text-blue-400" />}
                                            </button>
                                        ))}
                                    {tools.filter(t =>
                                        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        t.category.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).length === 0 && (
                                            <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                                No tools found
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handlePrev}
                            disabled={!hasPrev}
                            className={`p-2 rounded-lg transition-colors ${!hasPrev ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            title="Previous Tool (Arrow Up)"
                        >
                            <ChevronUp size={20} />
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={!hasNext}
                            className={`p-2 rounded-lg transition-colors ${!hasNext ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            title="Next Tool (Arrow Down)"
                        >
                            <ChevronDown size={20} />
                        </button>
                        <div className="w-px h-6 bg-slate-800 mx-2"></div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div
                    key={tool._id}
                    className="flex-1 overflow-y-auto p-6 custom-scrollbar animate-fade-in"
                >
                    {/* Title and Category */}
                    <div className="mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{tool.name}</h1>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <Tag size={12} className="mr-1.5" />
                                    {tool.category}
                                </span>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            {tool.description}
                        </p>

                        {/* Link Button */}
                        {tool.website && (
                            <a
                                href={tool.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-full space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5"
                            >
                                <span>Visit Website</span>
                                <ExternalLink size={16} />
                            </a>
                        )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Key Metrics</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
                                <div className="flex items-center text-slate-400 mb-2">
                                    <Calendar size={14} className="mr-2 opacity-70" />
                                    <span className="text-xs font-medium">Launch Date</span>
                                </div>
                                <p className="text-slate-200 font-semibold">
                                    {tool.launchDate ? new Date(tool.launchDate).getFullYear() : 'Unknown'}
                                </p>
                            </div>

                            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
                                <div className="flex items-center text-slate-400 mb-2">
                                    <TrendingUp size={14} className="mr-2 opacity-70" />
                                    <span className="text-xs font-medium">Growth</span>
                                </div>
                                <p className={`font-semibold ${tool.growth && tool.growth > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {tool.growth ? `+${tool.growth}%` : 'N/A'}
                                </p>
                            </div>

                            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30 col-span-2">
                                <div className="flex items-center text-slate-400 mb-2">
                                    <Globe size={14} className="mr-2 opacity-70" />
                                    <span className="text-xs font-medium">Global Usage</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-slate-200 font-semibold">High Demand</p>
                                    <div className="h-1.5 flex-1 mx-4 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolDetailsDrawer;
