import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';

const AdminCountries = () => {
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCountry, setEditingCountry] = useState(null);
    const [formData, setFormData] = useState({
        country: '',
        year: new Date().getFullYear(),
        aiIndexScore: '',
        globalRank: '',
        adoptionLevel: 'Medium'
    });

    useEffect(() => {
        fetchCountries();
    }, []);

    useEffect(() => {
        if (editingCountry) {
            setFormData({
                country: editingCountry.country,
                year: editingCountry.year,
                aiIndexScore: editingCountry.aiIndexScore || '',
                globalRank: editingCountry.globalRank || '',
                adoptionLevel: editingCountry.adoptionLevel || 'Medium'
            });
            setShowModal(true);
        } else {
            setFormData({
                country: '',
                year: new Date().getFullYear(),
                aiIndexScore: '',
                globalRank: '',
                adoptionLevel: 'Medium'
            });
        }
    }, [editingCountry]);

    const fetchCountries = async () => {
        try {
            const { data } = await api.get('/admin/countries');
            setCountries(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching countries:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/add-country-data', formData);
            setShowModal(false);
            setEditingCountry(null);
            fetchCountries();
        } catch (error) {
            console.error('Error saving country data:', error);
            alert('Failed to save country data');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this country data?')) {
            try {
                await api.delete(`/admin/delete-country/${id}`);
                fetchCountries();
            } catch (error) {
                console.error('Error deleting country:', error);
            }
        }
    };

    const filteredCountries = countries.filter(c =>
        c.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Global AI Analytics</h1>
                <button
                    onClick={() => { setEditingCountry(null); setShowModal(true); }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                >
                    <Plus size={20} />
                    Add Country Data
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search countries..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">Global Rank</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Country</th>
                            <th className="px-6 py-3 font-medium text-gray-500">AI Index Score</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Adoption Level</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
                        ) : filteredCountries.sort((a, b) => (a.globalRank || 999) - (b.globalRank || 999)).map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-700">
                                    {item.globalRank ? `#${item.globalRank}` : '-'}
                                </td>
                                <td className="px-6 py-4 font-medium">{item.country}</td>
                                <td className="px-6 py-4">{item.aiIndexScore || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-sm ${item.adoptionLevel === 'High' ? 'bg-green-100 text-green-700' :
                                        item.adoptionLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {item.adoptionLevel || 'Unknown'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => setEditingCountry(item)}
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
                                {editingCountry ? 'Edit Country Data' : 'Add Country Data'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country Name</label>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">AI Index Score (0-100)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.aiIndexScore}
                                        onChange={(e) => setFormData({ ...formData, aiIndexScore: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Global Rank</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.globalRank}
                                        onChange={(e) => setFormData({ ...formData, globalRank: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adoption Level</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.adoptionLevel}
                                    onChange={(e) => setFormData({ ...formData, adoptionLevel: e.target.value })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
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
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    {editingCountry ? 'Update Data' : 'Save Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCountries;
