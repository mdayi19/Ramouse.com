import React, { useState, useEffect, useMemo } from 'react';
import { getImageUrl } from '../../utils/helpers';
import { BlogPost } from '../../types';
import Modal from '../Modal';
import ImageUpload from '../ImageUpload';
import Pagination from '../Pagination';
import { ViewHeader, EditIcon, DeleteIcon } from './Shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { AdminService } from '../../services/admin.service';

const POSTS_PER_PAGE = 5;

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const BlogFormModal: React.FC<{
    post: Partial<BlogPost> | null;
    onSave: (post: Partial<BlogPost>) => void;
    onClose: () => void;
}> = ({ post, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<BlogPost>>(post || { author: 'فريق راموسة' });
    const [imageFile, setImageFile] = useState<File[]>([]);

    useEffect(() => {
        setFormData(post || { author: 'فريق راموسة' });
    }, [post]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleSlugify = () => {
        if (formData.title && !formData.slug) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .slice(0, 50);
            setFormData(p => ({ ...p, slug }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let finalData = { ...formData };
        if (imageFile.length > 0) {
            finalData.imageUrl = await fileToBase64(imageFile[0]);
        }
        onSave(finalData);
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm";

    return (
        <Modal title={post?.id ? 'تعديل المقال' : 'إنشاء مقال جديد'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="العنوان" name="title" value={formData.title || ''} onChange={handleChange} onBlur={handleSlugify} required />
                <Input label="الرابط (Slug)" name="slug" value={formData.slug || ''} onChange={handleChange} className="text-left" dir="ltr" required />
                <Textarea label="الملخص" name="summary" value={formData.summary || ''} onChange={handleChange} rows={3} required />
                <Textarea label="المحتوى (Markdown)" name="content" value={formData.content || ''} onChange={handleChange} rows={10} required />
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">صورة المقال</label>
                    {formData.imageUrl && !imageFile.length && <img src={getImageUrl(formData.imageUrl)} alt="preview" className="w-32 h-auto my-2 rounded border border-slate-200 dark:border-slate-700" />}
                    <ImageUpload files={imageFile} setFiles={setImageFile} maxFiles={1} />
                </div>
                <Input label="الكاتب" name="author" value={formData.author || ''} onChange={handleChange} required />
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <Button type="button" onClick={onClose} variant="ghost">إلغاء</Button>
                    <Button type="submit">حفظ</Button>
                </div>
            </form>
        </Modal>
    );
};

const BlogManagementView = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await AdminService.getBlogPosts();
            if (response.success && response.data) {
                const sorted = response.data.sort((a: BlogPost, b: BlogPost) =>
                    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                );
                setPosts(sorted);
            }
        } catch (err: any) {
            console.error('Error fetching blog posts:', err);
            setError(err.response?.data?.message || 'فشل في تحميل المقالات');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (postData: Partial<BlogPost>) => {
        try {
            if (postData.id) {
                // Editing
                const response = await AdminService.updateBlogPost(postData.id, postData);
                if (response.success) {
                    await fetchPosts();
                }
            } else {
                // Adding
                const response = await AdminService.createBlogPost(postData);
                if (response.success) {
                    await fetchPosts();
                }
            }
            setIsModalOpen(false);
        } catch (err: any) {
            console.error('Error saving blog post:', err);
            alert(err.response?.data?.message || 'فشل في حفظ المقال');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المقال؟')) {
            try {
                const response = await AdminService.deleteBlogPost(id);
                if (response.success) {
                    await fetchPosts();
                }
            } catch (err: any) {
                console.error('Error deleting blog post:', err);
                alert(err.response?.data?.message || 'فشل في حذف المقال');
            }
        }
    };

    const filteredPosts = useMemo(() => {
        return posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [posts, searchTerm]);

    const paginatedPosts = useMemo(() => {
        const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
        return filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
    }, [filteredPosts, currentPage]);

    if (loading) {
        return (
            <Card className="p-6">
                <ViewHeader title="إدارة المدونة" subtitle="إنشاء وتعديل وحذف مقالات المدونة." />
                <div className="text-center py-8">جاري التحميل...</div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-6">
                <ViewHeader title="إدارة المدونة" subtitle="إنشاء وتعديل وحذف مقالات المدونة." />
                <div className="text-center py-8 text-red-600">{error}</div>
                <div className="text-center">
                    <Button onClick={fetchPosts}>
                        إعادة المحاولة
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <ViewHeader title="إدارة المدونة" subtitle="إنشاء وتعديل وحذف مقالات المدونة." />
            <div className="flex justify-between items-center mb-6">
                <Input
                    type="text"
                    placeholder="ابحث..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Button onClick={() => { setEditingPost(null); setIsModalOpen(true); }}>
                    + مقال جديد
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 dark:bg-slate-700/50"><tr>
                        <th className="p-3">العنوان</th><th className="p-3">تاريخ النشر</th><th className="p-3">إجراءات</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">{paginatedPosts.map(post => (
                        <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 font-semibold">{post.title}</td>
                            <td className="p-3">{new Date(post.publishedAt).toLocaleDateString('ar-SY')}</td>
                            <td className="p-3 flex gap-3">
                                <Button onClick={() => { setEditingPost(post); setIsModalOpen(true); }} variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"><EditIcon className="w-4 h-4" /></Button>
                                <Button onClick={() => handleDelete(post.id)} variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"><DeleteIcon className="w-4 h-4" /></Button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
            {filteredPosts.length > POSTS_PER_PAGE && (
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredPosts.length / POSTS_PER_PAGE)}
                        onPageChange={setCurrentPage}
                        totalItems={filteredPosts.length}
                        itemsPerPage={POSTS_PER_PAGE}
                    />
                </div>
            )}
            {isModalOpen && <BlogFormModal post={editingPost} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </Card>
    );
};

export default BlogManagementView;
