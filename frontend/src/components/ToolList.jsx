import React from 'react';


const ToolList = ({ tools, onToolSelect, selectedTool }) => {
    return (
        <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6">
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {tools.map((tool) => {
                    const isSelected = selectedTool && selectedTool._id === tool._id;
                    return (
                        <div
                            key={tool._id}
                            onClick={() => onToolSelect && onToolSelect(tool)}
                            className={`tool-item-trigger block p-4 rounded-xl border transition-all duration-200 group cursor-pointer ${isSelected
                                ? 'bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500/20'
                                : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/30'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2 pointer-events-none">
                                <h3 className={`font-semibold transition-colors ${isSelected ? 'text-blue-400' : 'text-gray-100 group-hover:text-blue-400'
                                    }`}>
                                    {tool.name}
                                </h3>
                                <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-blue-300 border border-blue-500/20">
                                    {tool.category}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-2 pointer-events-none">
                                {tool.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ToolList;
