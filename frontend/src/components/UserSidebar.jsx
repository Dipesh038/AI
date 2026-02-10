import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, ChevronLeft, ChevronRight, Settings } from 'lucide-react';

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
                    setIsCollapsed(false);
                }
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/ai-tools', icon: List, label: 'AI Tools Catalog' },
    ];

    return (
        <div
            className={`sticky top-0 h-screen flex flex-col transition-all duration-300 ease-in-out z-50 
            bg-[#0B0F19]/80 backdrop-blur-xl border-r border-white/5 
            ${isCollapsed ? 'w-20' : 'w-64'}`}
        >
            {/* Header */}
            <div className={`h-16 flex items-center flex-shrink-0 px-5 border-b border-white/5 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <img src="/favicon.png" alt="AI Logo" className="w-5 h-5" />
                        </div>
                        <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 leading-none">
                            AI
                        </span>
                    </div>
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`group relative flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2 rounded-lg transition-all duration-300
                            ${active
                                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon
                                size={20}
                                className={`flex-shrink-0 transition-colors duration-300 ${active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}
                            />

                            {!isCollapsed && (
                                <span className={`ml-3 text-sm font-medium transition-opacity duration-300 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                    {item.label}
                                </span>
                            )}

                            {/* Tooltip for collapsed mode */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className={`p-4 border-t border-white/5 flex-shrink-0 ${isCollapsed ? 'hidden' : 'block'}`}>
                <p className="text-[10px] text-center text-gray-600 uppercase tracking-wider">
                    © 2026 AI Trends
                </p>
            </div>
        </div>
    );
};

export default UserSidebar;
