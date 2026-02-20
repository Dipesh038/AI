import React from 'react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import ImageResolver from './ImageResolver';

// A tool is "trending" if its growth field exceeds this threshold (%)
const TRENDING_THRESHOLD = 50;

const ToolList = ({ tools, onToolSelect, selectedTool }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {tools.map((tool, index) => {
                const isSelected = selectedTool && selectedTool._id === tool._id;
                const isEager = index < 3;
                const isTrending = tool.growth != null && tool.growth >= TRENDING_THRESHOLD;

                return (
                    <div
                        key={tool._id}
                        onClick={() => onToolSelect && onToolSelect(tool)}
                        className={`group relative flex flex-col rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden
                        ${isSelected
                                ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                                : 'bg-[#13131f]/60 backdrop-blur-md border-white/5 hover:border-blue-500/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-1'
                            }`}
                    >
                        {/* Trending badge — top-left corner */}
                        {isTrending && (
                            <div className="absolute top-3 left-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/90 backdrop-blur-sm text-white text-[10px] font-semibold shadow-lg">
                                <TrendingUp size={10} />
                                <span>Trending</span>
                            </div>
                        )}

                        {/* 1. Image Section (16:9) */}
                        <div className="w-full h-48 relative z-0">
                            <ImageResolver tool={tool} className="w-full h-full" eager={isEager} />

                            {/* Overlay Gradient for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#13131f] to-transparent opacity-60"></div>
                        </div>

                        {/* Content Container */}
                        <div className="p-5 flex flex-col flex-1 relative z-10 -mt-2">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-lg text-white group-hover:text-blue-200 transition-colors line-clamp-1">
                                    {tool.name}
                                </h3>
                                <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-medium text-blue-300 backdrop-blur-sm">
                                    {tool.category}
                                </span>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-4 flex-1">
                                {tool.description}
                            </p>

                            {/* Growth indicator (shown when available) */}
                            {tool.growth != null && (
                                <div className="flex items-center gap-1 mb-3">
                                    <TrendingUp size={12} className={tool.growth >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                                    <span className={`text-xs font-semibold ${tool.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {tool.growth >= 0 ? '+' : ''}{tool.growth}% growth
                                    </span>
                                </div>
                            )}

                            {/* Footer / Action */}
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                <div className="text-xs text-gray-500 font-medium group-hover:text-blue-400 transition-colors">
                                    View Details
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <ArrowUpRight size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Inner Glow/Hover Effect */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-10 pointer-events-none" />
                    </div>
                );
            })}
        </div>
    );
};

export default ToolList;
