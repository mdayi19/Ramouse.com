import React, { useState, useMemo, useEffect } from 'react';
import { getImageUrl } from '../utils/helpers';
import { BlogPost, ApiResponse } from '../types';
import { api } from '../lib/api';
import Icon from './Icon';
import Pagination from './Pagination';
import SEO from './SEO';

interface BlogScreenProps {
  onReadMore: (slug: string) => void;
  onBack: () => void;
}

const POSTS_PER_PAGE = 5;

const BlogScreen: React.FC<BlogScreenProps> = ({ onReadMore, onBack }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<ApiResponse<BlogPost[]>>('/blog');

        if (response.data.success && response.data.data) {
          setPosts(response.data.data);
        } else {
          setError('فشل في تحميل المقالات');
        }
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('حدث خطأ أثناء تحميل المقالات');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [posts]);

  const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    return sortedPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  }, [sortedPosts, currentPage]);

  return (
    <div className="w-full animate-fade-in">
      <SEO
        title="المدونة | راموسة"
        description="نصائح ومقالات حول صيانة السيارات، قطع الغيار، وأحدث أخبار عالم المحركات في سوريا."
        openGraph={{
          title: "مدونة راموسة | دليلك في عالم السيارات",
          description: "اقرأ أحدث المقالات والنصائح من خبراء السيارات في سوريا.",
          url: "https://ramouse.com/blog",
          type: "website"
        }}
      />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-primary-400">المدونة</h1>
          <p className="text-md text-slate-500 dark:text-slate-400 mt-1">مقالات ونصائح مفيدة حول عالم السيارات.</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors">
          <span>العودة</span>
          <Icon name="ArrowLeft" className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <Icon name="AlertCircle" className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
          <Icon name="Info" className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">لا توجد مقالات حالياً</p>
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {paginatedPosts.map(post => (
              <article key={post.id} className="bg-white dark:bg-darkcard rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-200 dark:border-slate-700">
                <div className="md:flex">
                  <div className="md:flex-shrink-0">
                    <img className="h-48 w-full object-cover md:w-48" src={getImageUrl(post.imageUrl)} alt={post.title} />
                  </div>
                  <div className="p-6 flex flex-col justify-between">
                    <div>
                      <div className="uppercase tracking-wide text-sm text-primary font-semibold">{new Date(post.publishedAt).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <h2 className="block mt-1 text-lg leading-tight font-bold text-black dark:text-white">{post.title}</h2>
                      <p className="mt-2 text-slate-500 dark:text-slate-400">{post.summary}</p>
                    </div>
                    <div className="mt-4">
                      <button onClick={() => onReadMore(post.slug)} className="text-primary dark:text-primary-400 font-semibold hover:underline flex items-center gap-2">
                        اقرأ المزيد <Icon name="ArrowLeft" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={POSTS_PER_PAGE}
                totalItems={posts.length}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlogScreen;