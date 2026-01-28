import axios from 'axios';
import { BlogPost, FaqItem, ApiResponse } from '../types';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || '/api';

export const contentService = {
    /**
     * Get all blog posts
     */
    async getBlogPosts(params?: { search?: string; limit?: number }): Promise<BlogPost[]> {
        const response = await axios.get<ApiResponse<BlogPost[]>>(`${API_BASE_URL}/blog`, { params });
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to fetch blog posts');
    },

    /**
     * Get a single blog post by ID or slug
     */
    async getBlogPost(identifier: string): Promise<BlogPost> {
        const response = await axios.get<ApiResponse<BlogPost>>(`${API_BASE_URL}/blog/${identifier}`);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Blog post not found');
    },

    /**
     * Get all FAQ items
     */
    async getFaqItems(): Promise<FaqItem[]> {
        const response = await axios.get<ApiResponse<FaqItem[]>>(`${API_BASE_URL}/faq`);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to fetch FAQ items');
    },

    /**
     * Get a single FAQ item
     */
    async getFaqItem(id: string): Promise<FaqItem> {
        const response = await axios.get<ApiResponse<FaqItem>>(`${API_BASE_URL}/faq/${id}`);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'FAQ item not found');
    },
};
