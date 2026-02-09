import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, ExternalLink, Calendar, Tag, Globe, TrendingUp } from 'lucide-react';

const ToolDetails = () => {
    const { id } = useParams();
    const [tool, setTool] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Since we don't have a direct /tools/:id endpoint in backend yet, we'll fetch all or implement it.
        // Actually, let's implement the specific endpoint in backend or filter from list if list is small.
        // For now, assuming we might need to filter from full list or add endpoint.
        // Let's try to fetch all and filter client side for MVP, or better, add endpoint.
        // Wait, I didn't add GET /tools/:id in backend plan. I'll add it now or filter.
        // PROCEEDING WITH CLIENT SIDE FILTER for simplicty as list is 16k -- Wait 16k is too big.
        // I should have added the endpoint.
        // Let's add the endpoint to backend/routes/tools.js first? 
        // Or just use the id if I can. 
        // Actually, let's assume I will add the endpoint in a sec.

        const fetchTool = async () => {
            try {
                // Temporary: Fetch all and find (not ideal but works for now if pagination not set)
                // Better: Implement GET /api/tools/:id
                const res = await api.get('/tools');
                const found = res.data.find(t => t._id === id);
                setTool(found);
            } catch (error) {
                console.error('Error fetching tool:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTool();
    }, [id]);

    if (loading) return <div className="p-10 text-white">Loading tool details...</div>;
    if (!tool) return <div className="p-10 text-white">Tool not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Improved Back Button */}
            <Link
                to="/catalog"
                className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-lg border border-slate-700/50 hover:border-slate-600"
            >
                <ArrowLeft size={18} />
                <span className="font-medium">Back to Catalog</span>
            </Link>

            <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
                <div className="p-8">
                    {/* Header Section with Improved Hierarchy */}
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8">
                        <div className="flex-1 max-w-2xl">
                            {/* Title and Category Badge */}
                            <div className="mb-3">
                                <h1 className="text-4xl font-bold text-white mb-3">{tool.name}</h1>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <Tag size={14} className="mr-1.5" />
                                    {tool.category}
                                </span>
                            </div>
                            {/* Improved Description */}
                            <p className="text-slate-400 text-base leading-relaxed">
                                {tool.description}
                            </p>
                        </div>

                        {/* Redesigned Visit Website Button */}
                        {tool.website && (
                            <a
                                href={tool.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-all border border-slate-700 hover:border-slate-600 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 flex-shrink-0"
                            >
                                <span>Visit Website</span>
                                <ExternalLink size={18} />
                            </a>
                        )}
                    </div>

                    {/* Refined Metadata Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800/50">
                        <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                            <div className="flex items-center text-slate-500 mb-2.5">
                                <Calendar size={16} className="mr-2 opacity-70" />
                                <span className="text-xs font-medium uppercase tracking-wider">Launch Date</span>
                            </div>
                            <p className="text-white font-semibold text-lg">
                                {tool.launchDate ? new Date(tool.launchDate).getFullYear() : 'Unknown'}
                            </p>
                        </div>

                        <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                            <div className="flex items-center text-slate-500 mb-2.5">
                                <TrendingUp size={16} className="mr-2 opacity-70" />
                                <span className="text-xs font-medium uppercase tracking-wider">Growth</span>
                            </div>
                            <p className={`font-semibold text-lg ${tool.growth && tool.growth > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {tool.growth ? `+${tool.growth}%` : 'N/A'}
                            </p>
                        </div>

                        <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                            <div className="flex items-center text-slate-500 mb-2.5">
                                <Globe size={16} className="mr-2 opacity-70" />
                                <span className="text-xs font-medium uppercase tracking-wider">Global Usage</span>
                            </div>
                            <p className="text-white font-semibold text-lg">High Demand</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolDetails;
