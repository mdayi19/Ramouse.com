import React, { useEffect, useState } from 'react';
import { getImageUrl } from '../utils/helpers';
import { generateBlogArticleSchema } from '../utils/structuredData';
import { BlogPost } from '../types';
import { contentService } from '../services/content.service';
import Icon from './Icon';
import SEO from './SEO';

interface BlogPostScreenProps {
  slug: string;
  onBack: () => void;
}

// Simple Markdown to HTML renderer
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const htmlContent = content
    .split('\n')
    .map(line => line.trim())
    .map(line => {
      if (line.startsWith('### ')) {
        return `<h3 class="text-xl font-bold mt-6 mb-2 text-slate-900 dark:text-slate-100">${line.substring(4)}</h3>`;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return `<p class="font-semibold">${line.substring(2, line.length - 2)}</p>`;
      }
      if (line.startsWith('- ')) {
        return `<li class="mb-2">${line.substring(2)}</li>`;
      }
      if (line === '') {
        return '<br />';
      }
      return `<p class="mb-4 leading-relaxed">${line}</p>`;
    })
    .join('')
    .replace(/<li>/g, '<ul class="list-disc list-inside space-y-2 mb-4"><li>')
    .replace(/<\/li>(?!<li)/g, '</li></ul>');

  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

const BlogPostScreen: React.FC<BlogPostScreenProps> = ({ slug, onBack }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedPost = await contentService.getBlogPost(slug);
        setPost(fetchedPost);
      } catch (err: any) {
        console.error('Error fetching blog post:', err);
        setError(err.response?.data?.message || 'فشل في تحميل المقال');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);



  if (loading) {
    return (
      <div className="w-full animate-fade-in">
        <div className="mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors">
            <Icon name="ArrowRight" className="h-4 w-4" />
            <span>العودة إلى المدونة</span>
          </button>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="w-full animate-fade-in">
        <div className="mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors">
            <Icon name="ArrowRight" className="h-4 w-4" />
            <span>العودة إلى المدونة</span>
          </button>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <Icon name="AlertCircle" className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 font-semibold">{error || 'لم يتم العثور على المقال'}</p>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors">
            العودة إلى المدونة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      {post && (
        <SEO
          title={`${post.title} | مدونة راموسة`}
          description={post.summary}
          openGraph={{
            title: post.title,
            description: post.summary,
            image: getImageUrl(post.imageUrl),
            type: 'article'
          }}
          schema={{
            type: 'BlogPosting', // Legacy override, but data is custom now
            data: generateBlogArticleSchema(post)
          }}
        />
      )}
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors">
          <Icon name="ArrowRight" className="h-4 w-4" />
          <span>العودة إلى المدونة</span>
        </button>
      </div>

      <article className="bg-white dark:bg-darkcard rounded-xl shadow-lg overflow-hidden">
        <img className="h-64 w-full object-cover" src={getImageUrl(post.imageUrl)} alt={post.title} />
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <span>بواسطة: {post.author}</span>
            <span>|</span>
            <span>{new Date(post.publishedAt).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
            <MarkdownRenderer content={post.content} />
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPostScreen;