import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, X, Search, TrendingUp } from 'lucide-react';

const AdminToolGrowth = () => {
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Filter states
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    // Generate years (e.g., current year +/- 2 years)
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const [formData, setFormData] = useState({
        toolName: '',
        category: '',
        year: currentYear,
        growthPercent: '',
        rank: ''
    });

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, [selectedYear]);

    useEffect(() => {
        if (editingItem) {
            setFormData({
                toolName: editingItem.toolName,
                category: editingItem.category,
                year: editingItem.year,
                growthPercent: editingItem.growthPercent,
                rank: editingItem.rank || ''
            });
            setShowModal(true);
        } else {
            setFormData({
                toolName: '',
                category: '',
                year: selectedYear,
                growthPercent: '',
                rank: ''
            });
        }
    }, [editingItem, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics/growth?year=${selectedYear}`);
            // Sort by growth desc
            const sortedData = res.data.sort((a, b) => b.growthPercent - a.growthPercent);
            setData(sortedData);
        } catch (error) {
            console.error('Error fetching growth data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/admin/categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/analytics/growth', formData);
            setShowModal(false);
            setEditingItem(null);
            fetchData();
        } catch (error) {
            console.error('Error saving data:', error);
            alert(error.response?.data?.message || 'Failed to save data');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                await api.delete(`/analytics/growth/${id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting record:', error);
            }
        }
    };

    const filteredData = data.filter(item =>
        item.toolName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="text-emerald-600" />
                    Fastest Growing Tools
                </h1>
                <button
                    onClick={() => { setEditingItem(null); setShowModal(true); }}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700"
                >
                    <Plus size={20} />
                    Add Growth Stat
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">Rank</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Tool Name</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Category</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Growth %</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-8 text-gray-500">No data found for this year.</td></tr>
                        ) : filteredData.map((item, index) => (
                            <tr key={item._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-700">
                                    #{index + 1}
                                </td>
                                <td className="px-6 py-4 font-medium">{item.toolName}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-emerald-600">
                                    +{item.growthPercent}%
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => setEditingItem(item)}
                                        className="text-blue-600 hover:text-blue-800 p-1"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="text-red-600 hover:text-red-800 p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editingItem ? 'Edit Growth Stat' : 'Add Growth Stat'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                    <input
                                        type="number"
                                        required
                                        min="1900"
                                        max="2100"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Growth %</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.growthPercent}
                                        onChange={(e) => setFormData({ ...formData, growthPercent: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.toolName}
                                    onChange={(e) => setFormData({ ...formData, toolName: e.target.value })}
                                    placeholder="e.g. ChatGPT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                    {editingItem ? 'Update Stat' : 'Add Stat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminToolGrowth;
