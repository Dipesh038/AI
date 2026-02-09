import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, X, Edit2 } from 'lucide-react';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (editingCategory) {
            setFormData({
                name: editingCategory.name,
                description: editingCategory.description || ''
            });
            setShowModal(true);
        } else {
            setFormData({
                name: '',
                description: ''
            });
        }
    }, [editingCategory]);

    const fetchData = async () => {
        try {
            const [categoriesRes, toolsRes] = await Promise.all([
                api.get('/admin/categories'),
                api.get('/admin/tools')
            ]);
            setCategories(categoriesRes.data);
            setTools(toolsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/admin/update-category/${editingCategory._id}`, formData);
            } else {
                await api.post('/admin/add-category', formData);
            }
            setShowModal(false);
            setEditingCategory(null);
            fetchData();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Failed to save category');
        }
    };

    const handleDelete = async (id) => {
        // Check if tools exist in this category
        const categoryName = categories.find(c => c._id === id)?.name;
        const toolCount = tools.filter(t => t.category === categoryName).length;

        if (toolCount > 0) {
            alert(`Cannot delete category "${categoryName}" because it has ${toolCount} tool(s). Please reassign or delete the tools first.`);
            return;
        }

        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await api.delete(`/admin/delete-category/${id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
                <button
                    onClick={() => { setEditingCategory(null); setShowModal(true); }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
                >
                    <Plus size={20} />
                    Add Category
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Description</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Tools</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-8">Loading...</td></tr>
                        ) : categories.map((category) => {
                            const count = tools.filter(t => t.category === category.name).length;
                            return (
                                <tr key={category._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{category.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{category.description || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                            {count}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => setEditingCategory(category)}
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category._id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editingCategory ? 'Edit Category' : 'Add Category'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
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
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    {editingCategory ? 'Update Category' : 'Add Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
