import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Save, X } from 'lucide-react';

interface CarCategory {
    id: number;
    name_ar: string;
    name_en: string;
    icon?: string;
    created_at: string;
}

interface Props {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CarCategoriesView: React.FC<Props> = ({ showToast }) => {
    const [categories, setCategories] = useState<CarCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name_ar: '',
        name_en: '',
        icon: ''
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/car-categories', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setCategories(data.data || data);
        } catch (error) {
            showToast('Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name_ar || !formData.name_en) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const url = editingId
                ? `/api/admin/car-categories/${editingId}`
                : '/api/admin/car-categories';
            const method = editingId ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            showToast(
                editingId ? 'Category updated successfully' : 'Category created successfully',
                'success'
            );

            resetForm();
            loadCategories();
        } catch (error) {
            showToast('Failed to save category', 'error');
        }
    };

    const handleEdit = (category: CarCategory) => {
        setEditingId(category.id);
        setFormData({
            name_ar: category.name_ar,
            name_en: category.name_en,
            icon: category.icon || ''
        });
        setShowAddForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await fetch(`/api/admin/car-categories/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            showToast('Category deleted successfully', 'success');
            loadCategories();
        } catch (error) {
            showToast('Failed to delete category', 'error');
        }
    };

    const resetForm = () => {
        setFormData({ name_ar: '', name_en: '', icon: '' });
        setEditingId(null);
        setShowAddForm(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Car Categories</h2>
                    <p className="text-gray-600 dark:text-gray-400">Manage vehicle categories</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadCategories}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showAddForm ? 'Cancel' : 'Add Category'}
                    </button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        {editingId ? 'Edit Category' : 'Add New Category'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Arabic Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name_ar}
                                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    placeholder="سيدان"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    English Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name_en}
                                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                    placeholder="Sedan"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Icon (optional)
                            </label>
                            <input
                                type="text"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                placeholder="car-icon"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                {editingId ? 'Update' : 'Create'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {category.name_en}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {category.name_ar}
                                </p>
                                {category.icon && (
                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                                        Icon: {category.icon}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(category)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(category.id)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No categories found</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Create your first category
                    </button>
                </div>
            )}
        </div>
    );
};

export default CarCategoriesView;
