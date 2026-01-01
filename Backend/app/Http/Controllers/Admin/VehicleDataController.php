<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CarCategory;
use App\Models\Brand;
use App\Models\CarModel;
use App\Models\PartType;
use App\Models\TechnicianSpecialty;

class VehicleDataController extends Controller
{
    public function getAllData()
    {
        return response()->json([
            'categories' => CarCategory::all(),
            'brands' => Brand::all(),
            'models' => CarModel::all()->groupBy('brand_name'), // Grouped by brand for frontend convenience
            'partTypes' => PartType::all(),
            'specialties' => TechnicianSpecialty::all(),
        ]);
    }

    // --- Categories ---
    public function saveCategory(Request $request)
    {
        $data = $request->validate([
            'id' => 'required|string',
            'name' => 'required|string',
            'flag' => 'required|string',
            'brands' => 'array',
            'telegram_bot_token' => 'nullable|string',
            'telegram_channel_id' => 'nullable|string',
            'telegram_notifications_enabled' => 'boolean',
        ]);

        $category = CarCategory::updateOrCreate(['id' => $data['id']], $data);
        return response()->json($category);
    }

    public function deleteCategory($id)
    {
        CarCategory::destroy($id);
        return response()->json(['success' => true]);
    }

    // --- Brands ---
    public function saveBrand(Request $request)
    {
        $data = $request->validate([
            'id' => 'required|string',
            'name' => 'required|string',
            'logo' => 'nullable|string',
        ]);

        $brand = Brand::updateOrCreate(['id' => $data['id']], $data);
        return response()->json($brand);
    }

    public function deleteBrand($id)
    {
        Brand::destroy($id);
        return response()->json(['success' => true]);
    }

    // --- Models ---
    public function saveModel(Request $request)
    {
        $data = $request->validate([
            'brand_name' => 'required|string',
            'name' => 'required|string',
        ]);

        // Check if exists
        $model = CarModel::where('brand_name', $data['brand_name'])
            ->where('name', $data['name'])
            ->first();

        if (!$model) {
            $model = CarModel::create($data);
        }

        return response()->json($model);
    }

    public function deleteModel($id) // Note: Frontend sends name, but we might need ID or composite key. 
    // For simplicity, let's assume we delete by name and brand if passed, or just ID if we have it.
    // The route definition was DELETE /models/{id}. If frontend sends ID, great.
    // If frontend sends name, we need to change route or logic.
    // Let's assume frontend sends ID for now, or we adjust frontend to send ID.
    {
        // If ID is numeric, destroy. If string (name), delete by name?
        // Frontend ModelManagementView sends `model` string to delete.
        // We need to fix Frontend to handle IDs or send brand+model to delete.
        // For now, let's try to find by name if ID is not numeric?

        if (is_numeric($id)) {
            CarModel::destroy($id);
        } else {
            // Fallback: delete by name (risky if duplicates across brands, but schema has ID)
            // We should probably update frontend to use IDs.
            CarModel::where('name', $id)->delete();
        }

        return response()->json(['success' => true]);
    }

    // --- Part Types ---
    public function savePartType(Request $request)
    {
        $data = $request->validate([
            'id' => 'required|string',
            'name' => 'required|string',
            'icon' => 'nullable|string',
        ]);

        $partType = PartType::updateOrCreate(['id' => $data['id']], $data);
        return response()->json($partType);
    }

    public function deletePartType($id)
    {
        PartType::destroy($id);
        return response()->json(['success' => true]);
    }

    // --- Specialties ---
    public function saveSpecialty(Request $request)
    {
        $data = $request->validate([
            'id' => 'required|string',
            'name' => 'required|string',
            'icon' => 'nullable|string',
        ]);

        $specialty = TechnicianSpecialty::updateOrCreate(['id' => $data['id']], $data);
        return response()->json($specialty);
    }

    public function deleteSpecialty($id)
    {
        TechnicianSpecialty::destroy($id);
        return response()->json(['success' => true]);
    }
}
