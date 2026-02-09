import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, X, Search, BarChart2 } from 'lucide-react';

const AdminToolPopularity = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [countries, setCountries] = useState([]);

    // Filter states
    const [selectedCountry, setSelectedCountry] = useState(''); // Default to empty or first country after fetch
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    // Generate years (e.g., current year +/- 2 years)
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const [formData, setFormData] = useState({
        country: '',
        year: currentYear,
        toolName: '',
        popularity: ''
    });

    useEffect(() => {
        fetchCountries();
    }, []);

    useEffect(() => {
        if (selectedCountry) {
            fetchData();
        }
    }, [selectedCountry, selectedYear]);

    useEffect(() => {
        if (editingItem) {
            setFormData({
                country: editingItem.country,
                year: editingItem.year,
                toolName: editingItem.toolName,
                popularity: editingItem.popularity
            });
            setShowModal(true);
        } else {
            setFormData({
                country: selectedCountry,
                year: selectedYear,
                toolName: '',
                popularity: ''
            });
        }
    }, [editingItem, selectedCountry, selectedYear]);

    const fetchCountries = async () => {
        try {
            const res = await api.get('/analytics/popularity/countries');
            setCountries(res.data);
            if (res.data.length > 0 && !selectedCountry) {
                setSelectedCountry(res.data[0].country);
                setFormData(prev => ({ ...prev, country: res.data[0].country }));
            }
        } catch (error) {
            console.error('Error fetching countries:', error);
        }
    };

    const fetchData = async () => {
        if (!selectedCountry) return;
        setLoading(true);
        try {
            const res = await api.get(`/analytics/popularity?country=${selectedCountry}&year=${selectedYear}`);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching popularity data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/analytics/popularity', formData);
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
                await api.delete(`/analytics/popularity/${id}`);
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
                    <BarChart2 className="text-blue-600" />
                    Tool Popularity Manager
                </h1>
                <button
                    onClick={() => { setEditingItem(null); setShowModal(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add Record
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
                        <label className="block text-xs text-gray-500 mb-1">Country</label>
                        <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {countries.map(c => (
                                <option key={c._id} value={c.country}>{c.country}</option>
                            ))}
                        </select>
                    </div>
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
                            <th className="px-6 py-3 font-medium text-gray-500">Tool Name</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Popularity Score</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Visual Bar</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-8">Loading...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-8 text-gray-500">No data found for this selection.</td></tr>
                        ) : filteredData.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{item.toolName}</td>
                                <td className="px-6 py-4 font-bold text-blue-600">{item.popularity}%</td>
                                <td className="px-6 py-4 w-1/3">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{ width: `${item.popularity}%` }}
                                        ></div>
                                    </div>
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
                                {editingItem ? 'Edit Popularity' : 'Add Popularity Record'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    />
                                </div>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Popularity Score (0-100)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.popularity}
                                    onChange={(e) => setFormData({ ...formData, popularity: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Used for the bar chart visualization.</p>
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
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingItem ? 'Update Record' : 'Add Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminToolPopularity;
