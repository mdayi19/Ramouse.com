import React, { useState, useEffect, useMemo } from 'react';
import { getImageUrl } from '../../utils/helpers';
import { BlogPost } from '../../types';
import Modal from '../Modal';
import ImageUpload from '../ImageUpload';
import Pagination from '../Pagination';
import { ViewHeader, EditIcon, DeleteIcon, Icon } from './Shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { AdminService } from '../../services/admin.service';

const POSTS_PER_PAGE = 6;

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
                .replace(/[^a-z0-9\\s-]/g, '')
                .replace(/\\s+/g, '-')
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

    return (
        <Modal title={post?.id ? ' تعديل المقال' : '✨ إنشاء مقال جديد'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="العنوان"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    onBlur={handleSlugify}
                    required
                    className="bg-slate-50 dark:bg-slate-900/50"
                />
                <Input
                    label="الرابط (Slug)"
                    name="slug"
                    value={formData.slug || ''}
                    onChange={handleChange}
                    className="text-left font-mono bg-slate-50 dark:bg-slate-900/50"
                    dir="ltr"
                    required
                />
                <Textarea
                    label="الملخص"
                    name="summary"
                    value={formData.summary || ''}
                    onChange={handleChange}
                    rows={3}
                    required
                    className="bg-slate-50 dark:bg-slate-900/50"
                />
                <Textarea
                    label="المحتوى (Markdown)"
                    name="content"
                    value={formData.content || ''}
                    onChange={handleChange}
                    rows={12}
                    required
                    className="bg-slate-50 dark:bg-slate-900/50 font-mono text-sm"
                />
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">صورة المقال</label>
                    {formData.imageUrl && !imageFile.length && (
                        <img
                            src={getImageUrl(formData.imageUrl)}
                            alt="preview"
                            className="w-full max-w-sm h-auto my-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md"
                        />
                    )}
                    <ImageUpload files={imageFile} setFiles={setImageFile} maxFiles={1} />
                </div>
                <Input
                    label="الكاتب"
                    name="author"
                    value={formData.author || ''}
                    onChange={handleChange}
                    required
                    className="bg-slate-50 dark:bg-slate-900/50"
                />
                <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 dark:border-slate-700 mt-6">
                    <Button type="button" onClick={onClose} variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800">إلغاء</Button>
                    <Button type="submit" className="shadow-lg shadow-primary/20">
                        <Icon name="Save" className="w-4 h-4 ml-2" />
                        حفظ المقال
                    </Button>
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
    const [isRefreshing, setIsRefreshing] = useState(false);

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
                const response = await AdminService.updateBlogPost(postData.id, postData);
                if (response.success) {
                    await fetchPosts();
                }
            } else {
                const response = await AdminService.createBlogPost(postData);
                if (response.success) {
                    await fetchPosts();
                }
            }
            setIsModalOpen(false);
            setEditingPost(null);
        } catch (err: any) {
            console.error('Error saving blog post:', err);
            alert(err.response?.data?.message || 'فشل في حفظ المقال');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.')) {
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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchPosts();
        setTimeout(() => setIsRefreshing(false), 500);
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
            <div className="space-y-6">
                <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-xl">
                    <ViewHeader title="📝 إدارة المدونة" subtitle="إنشاء وتعديل وحذف مقالات المدونة." />
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700"></div>
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary absolute top-0"></div>
                        </div>
                        <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">جاري تحميل المقالات...</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="p-8 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-xl">
                <ViewHeader title="📝 إدارة المدونة" subtitle="إنشاء وتعديل وحذف مقالات المدونة." />
                <div className="flex flex-col items-center justify-center py-12 bg-red-50 dark:bg-red-900/20 rounded-2xl border-2 border-red-200 dark:border-red-800 mt-6">
                    <Icon name="AlertCircle" className="w-16 h-16 text-red-500 mb-4" />
                    <p className="text-red-600 dark:text-red-400 font-bold text-lg mb-2">حدث خطأ</p>
                    <p className="text-red-500 dark:text-red-300 text-sm mb-4">{error}</p>
                    <Button onClick={fetchPosts} className="shadow-lg shadow-primary/20">
                        <Icon name="RefreshCw" className="w-4 h-4 ml-2" />
                        إعادة المحاولة
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Card */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-darkcard/90 dark:to-slate-900/90 border-none shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <ViewHeader title="📝 إدارة المدونة" subtitle="إنشاء وتعديل وحذف مقالات المدونة." />
                    <div className="flex gap-3">
                        <Button
                            onClick={handleRefresh}
                            variant="secondary"
                            size="icon"
                            className={`rounded-full shadow-md bg-white dark:bg-slate-800 ${isRefreshing ? 'animate-pulse' : ''}`}
                        >
                            <Icon name="RefreshCw" className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            onClick={() => { setEditingPost(null); setIsModalOpen(true); }}
                            className="shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <Icon name="Plus" className="w-4 h-4 ml-2" />
                            مقال جديد
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Search & Stats */}
            <Card className="p-5 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md w-full">
                        <Icon name="Search" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="ابحث في المقالات..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pr-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                    <div className="flex gap-4">
                        <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-4 py-2">
                            <Icon name="FileText" className="w-4 h-4 ml-2" />
                            {posts.length} مقالات
                        </Badge>
                    </div>
                </div>
            </Card>

            {/* Blog Posts Grid */}
            {paginatedPosts.length === 0 ? (
                <Card className="p-12 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-6  shadow-inner">
                            <Icon name="FileText" className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">لا توجد مقالات</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">ابدأ بإنشاء مقال جديد لمشاركة محتوى قيم مع زوار موقعك</p>
                        <Button onClick={() => { setEditingPost(null); setIsModalOpen(true); }} className="shadow-lg shadow-primary/20">
                            <Icon name="Plus" className="w-4 h-4 ml-2" />
                            إنشاء أول مقال
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedPosts.map((post, index) => (
                        <Card
                            key={post.id}
                            className="group overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Image */}
                            {post.imageUrl && (
                                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
                                    <img
                                        src={getImageUrl(post.imageUrl)}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                                    {post.summary}
                                </p>

                                {/* Meta */}
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                    <span className="flex items-center gap-1.5">
                                        <Icon name="User" className="w-3.5 h-3.5" />
                                        {post.author}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Icon name="Calendar" className="w-3.5 h-3.5" />
                                        {new Date(post.publishedAt).toLocaleDateString('ar-SY')}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => { setEditingPost(post); setIsModalOpen(true); }}
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    >
                                        <EditIcon className="w-4 h-4 ml-2" />
                                        تعديل
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(post.id)}
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <DeleteIcon className="w-4 h-4 ml-2" />
                                        حذف
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {filteredPosts.length > POSTS_PER_PAGE && (
                <Card className="p-4 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredPosts.length / POSTS_PER_PAGE)}
                        onPageChange={setCurrentPage}
                        totalItems={filteredPosts.length}
                        itemsPerPage={POSTS_PER_PAGE}
                    />
                </Card>
            )}

            {/* Modal */}
            {isModalOpen && <BlogFormModal post={editingPost} onSave={handleSave} onClose={() => { setIsModalOpen(false); setEditingPost(null); }} />}
        </div>
    );
};

export default BlogManagementView;
