import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, ChevronLeft, ChevronRight } from 'lucide-react';

const UserSidebar = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Responsive behavior: auto-collapse on mobile, allow re-expansion on desktop
    useEffect(() => {
        const handleResize = () => {
            if (typeof window !== 'undefined') {
                if (window.innerWidth < 768) {
                    setIsCollapsed(true);
                } else if (window.innerWidth >= 1024) {
                    // Allow re-expansion on larger screens
                    setIsCollapsed(false);
                }
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/ai-tools', icon: List, label: 'AI Tools Catalog' },
    ];

    return (
        <div
            className={`bg-slate-950 text-gray-100 min-h-screen flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Header with Logo and Toggle */}
            <div className={`p-5 border-b border-slate-800 bg-slate-950 flex items-center flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'
                }`}>
                {!isCollapsed && (
                    <div className="text-xl font-bold whitespace-nowrap">
                        AI Dashboard
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-expanded={!isCollapsed}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`group relative flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'
                                } p-3 rounded-lg transition-all duration-200 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${active
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                            aria-label={item.label}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon size={20} className="flex-shrink-0" />
                            <span
                                className={`whitespace-nowrap transition-all duration-300 ${isCollapsed
                                    ? 'opacity-0 pointer-events-none w-0 overflow-hidden'
                                    : 'opacity-100'
                                    }`}
                            >
                                {item.label}
                            </span>

                            {/* Tooltip for collapsed mode */}
                            {isCollapsed && (
                                <div
                                    className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible transition-all duration-200 whitespace-nowrap z-50 border border-slate-700 shadow-lg pointer-events-none"
                                    role="tooltip"
                                    aria-hidden="true"
                                >
                                    {item.label}
                                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 rotate-45"></div>
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div
                className={`p-4 text-sm text-gray-500 border-t border-slate-800 flex-shrink-0 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
            >
                © 2024 AI Trends
            </div>
        </div>
    );
};

export default UserSidebar;
