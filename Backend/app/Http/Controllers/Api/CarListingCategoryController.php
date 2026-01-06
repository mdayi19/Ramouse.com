<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CarListingCategory;
use Illuminate\Http\Request;

class CarListingCategoryController extends Controller
{
    /**
     * Get all active categories (PUBLIC)
     */
    public function index()
    {
        $categories = CarListingCategory::active()->get();

        return response()->json([
            'success' => true,
            'categories' => $categories
        ]);
    }

    /**
     * Get single category (PUBLIC)
     */
    public function show($id)
    {
        $category = CarListingCategory::findOrFail($id);

        return response()->json([
            'success' => true,
            'category' => $category
        ]);
    }
}
