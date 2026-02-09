import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LayoutDashboard, Wrench, FolderTree, Globe } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, to }) => (
    <Link to={to} className="block transition-transform hover:scale-105 active:scale-95">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={20} className="text-white" />
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
    </Link>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        toolsCount: 0,
        categoriesCount: 0,
        countriesCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/admin/stats');
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total AI Tools"
                    value={stats.toolsCount}
                    icon={Wrench}
                    color="bg-blue-500"
                    to="/admin/tools"
                />
                <StatCard
                    title="Categories"
                    value={stats.categoriesCount}
                    icon={FolderTree}
                    color="bg-purple-500"
                    to="/admin/categories"
                />
                <StatCard
                    title="Tracked Countries"
                    value={stats.countriesCount}
                    icon={Globe}
                    color="bg-green-500"
                    to="/admin/countries"
                />
            </div>
        </div>
    );
};

export default AdminDashboard;
