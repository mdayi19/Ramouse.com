<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\FaqItem;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ContentController extends Controller
{
    /**
     * Get all published blog posts
     */
    public function listBlogPosts(Request $request): JsonResponse
    {
        $query = BlogPost::query();

        // Filter by search term
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ILIKE', "%{$search}%")
                    ->orWhere('summary', 'ILIKE', "%{$search}%")
                    ->orWhere('content', 'ILIKE', "%{$search}%");
            });
        }

        // Order by published date
        $query->orderBy('published_at', 'desc');

        // Get posts
        if ($request->has('limit')) {
            $posts = $query->limit($request->limit)->get();
        } else {
            $posts = $query->get(); // Get all posts instead of paginating for admin
        }

        return response()->json([
            'success' => true,
            'data' => $posts,
        ]);
    }

    /**
     * Get a single blog post by ID or slug
     */
    public function getBlogPost(string $identifier): JsonResponse
    {
        // Try to find by ID first, then by slug
        $post = BlogPost::where('id', $identifier)
            ->orWhere('slug', $identifier)
            ->first();

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Blog post not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $post,
        ]);
    }

    /**
     * Get all FAQ items
     */
    public function listFaqItems(): JsonResponse
    {
        $faqs = FaqItem::orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $faqs,
        ]);
    }

    /**
     * Get a single FAQ item
     */
    public function getFaqItem(string $id): JsonResponse
    {
        $faq = FaqItem::find($id);

        if (!$faq) {
            return response()->json([
                'success' => false,
                'message' => 'FAQ item not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $faq,
        ]);
    }
    /**
     * Get all announcements
     */
    public function listAnnouncements(): JsonResponse
    {
        $announcements = Announcement::orderBy('timestamp', 'desc')->get();

        // Transform to camelCase for frontend
        $transformedAnnouncements = $announcements->map(function ($announcement) {
            return [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'message' => $announcement->message,
                'target' => $announcement->target,
                'imageUrl' => $announcement->image_url,
                'timestamp' => $announcement->timestamp,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformedAnnouncements,
        ]);
    }
}
