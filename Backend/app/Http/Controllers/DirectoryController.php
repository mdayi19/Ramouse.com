<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Technician;
use App\Models\TowTruck;

class DirectoryController extends Controller
{
    public function listTechnicians(Request $request)
    {
        $query = Technician::query()
            ->where('is_active', true)
            ->where('is_verified', true);

        // Select basic fields + lat/lng for convenience (MySQL syntax)
        $query->select('*', \Illuminate\Support\Facades\DB::raw('ST_Y(location) as lat, ST_X(location) as lng'));

        if ($request->filled('city') && $request->city !== 'الكل') {
            $query->where('city', $request->city);
        }

        if ($request->filled('specialty') && $request->specialty !== 'الكل') {
            $query->where('specialty', $request->specialty);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('specialty', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('unique_id', 'like', "%{$search}%");
            });
        }

        // Geolocation sorting
        if ($request->filled(['lat', 'lng']) && $request->sort === 'distance') {
            $lat = $request->lat;
            $lng = $request->lng;

            // Order by distance (meters) - MySQL syntax
            $query->orderByRaw("ST_Distance_Sphere(location, ST_PointFromText(CONCAT('POINT(', ?, ' ', ?, ')'), 4326)) ASC", [$lng, $lat]);

            // Select distance in km for display
            $query->selectRaw("ST_Distance_Sphere(location, ST_PointFromText(CONCAT('POINT(', ?, ' ', ?, ')'), 4326)) / 1000 as distance_km", [$lng, $lat]);
        } elseif ($request->sort === 'rating') {
            $query->orderBy('average_rating', 'desc');
        } else {
            $query->latest();
        }

        $technicians = $query->get()->map(function ($tech) {
            $data = [
                'id' => $tech->id,
                'uniqueId' => $tech->unique_id,
                'name' => $tech->name,
                'specialty' => $tech->specialty,
                'city' => $tech->city,
                'serviceArea' => $tech->service_area,
                'description' => $tech->description,
                'isVerified' => $tech->is_verified,
                'isActive' => $tech->is_active,
                'profilePhoto' => $tech->profile_photo ? url('storage/' . $tech->profile_photo) : null,
                'gallery' => $this->formatGallery($tech->gallery),
                'socials' => $tech->socials ?? [],
                'qrCodeUrl' => $tech->qr_code_url,
                'averageRating' => $tech->average_rating ? (float) $tech->average_rating : 0,
                'location' => $tech->location,
                'reviews' => $tech->reviews ?? [],
            ];

            if (isset($tech->distance_km)) {
                $data['distance'] = round($tech->distance_km, 1);
            }

            return $data;
        });

        return response()->json(['data' => $technicians]);
    }

    public function getTechnician($id)
    {
        $tech = Technician::findOrFail($id);

        $data = [
            'id' => $tech->id,
            'uniqueId' => $tech->unique_id,
            'name' => $tech->name,
            'specialty' => $tech->specialty,
            'city' => $tech->city,
            'serviceArea' => $tech->service_area,
            'description' => $tech->description,
            'isVerified' => $tech->is_verified,
            'isActive' => $tech->is_active,
            'profilePhoto' => $tech->profile_photo ? url('storage/' . $tech->profile_photo) : null,
            'gallery' => $this->formatGallery($tech->gallery),
            'socials' => $tech->socials ?? [],
            'qrCodeUrl' => $tech->qr_code_url,
            'averageRating' => $tech->average_rating ? (float) $tech->average_rating : 0,
            'location' => $tech->location,
            'reviews' => $tech->reviews ?? [],
            'workshopAddress' => $tech->workshop_address,
        ];

        return response()->json(['data' => $data]);
    }

    public function listTowTrucks(Request $request)
    {
        $query = TowTruck::select('*', \Illuminate\Support\Facades\DB::raw('ST_Y(location) as lat, ST_X(location) as lng'))
            ->where('is_active', true)
            ->where('is_verified', true);

        if ($request->has('city')) {
            $query->where('city', $request->city);
        }

        if ($request->has('vehicle_type')) {
            $query->where('vehicle_type', $request->vehicle_type);
        }

        $towTrucks = $query->get()->map(function ($truck) {
            return [
                'id' => $truck->id,
                'uniqueId' => $truck->unique_id,
                'name' => $truck->name,
                'vehicleType' => $truck->vehicle_type,
                'city' => $truck->city,
                'serviceArea' => $truck->service_area,
                'description' => $truck->description,
                'isVerified' => $truck->is_verified,
                'isActive' => $truck->is_active,
                'profilePhoto' => $truck->profile_photo,
                'gallery' => $truck->gallery ?? [],
                'socials' => $truck->socials ?? [],
                'qrCodeUrl' => $truck->qr_code_url,
                'averageRating' => $truck->average_rating ? (float) $truck->average_rating : 0,
                'location' => $truck->location, // This will use the accessor
                'reviews' => $truck->reviews ?? [],
            ];
        });

        return response()->json(['data' => $towTrucks]);
    }

    public function getTowTruck($id)
    {
        $truck = TowTruck::findOrFail($id);

        $data = [
            'id' => $truck->id,
            'uniqueId' => $truck->unique_id,
            'name' => $truck->name,
            'vehicleType' => $truck->vehicle_type,
            'city' => $truck->city,
            'serviceArea' => $truck->service_area,
            'description' => $truck->description,
            'isVerified' => $truck->is_verified,
            'isActive' => $truck->is_active,
            'profilePhoto' => $truck->profile_photo,
            'gallery' => $truck->gallery ?? [],
            'socials' => $truck->socials ?? [],
            'qrCodeUrl' => $truck->qr_code_url,
            'averageRating' => $truck->average_rating ? (float) $truck->average_rating : 0,
            'location' => $truck->location, // This will use the accessor
            'reviews' => $truck->reviews ?? [],
        ];

        return response()->json(['data' => $data]);
    }

    /**
     * Format gallery items with full URLs
     */
    private function formatGallery($gallery)
    {
        if (!$gallery || !is_array($gallery)) {
            return [];
        }

        return array_map(function ($item) {
            return [
                'type' => $item['type'] ?? 'image',
                'url' => isset($item['path']) ? url('storage/' . $item['path']) : null,
                'uploaded_at' => $item['uploaded_at'] ?? null
            ];
        }, $gallery);
    }
}
