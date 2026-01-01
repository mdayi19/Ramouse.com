<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class InspectTowTruckUrls extends Command
{
    protected $signature = 'fix:tow-truck-urls';
    protected $description = 'Fix image URLs in tow_trucks table to be relative';

    public function handle()
    {
        $trucks = \App\Models\TowTruck::all();
        $count = 0;
        foreach ($trucks as $truck) {
            $updated = false;

            // Fix Profile Photo
            if ($truck->profile_photo && str_contains($truck->profile_photo, 'http://localhost:8001')) {
                $truck->profile_photo = str_replace('http://localhost:8001', '', $truck->profile_photo);
                $updated = true;
            }
            if ($truck->profile_photo && str_contains($truck->profile_photo, 'http://localhost:8000')) {
                $truck->profile_photo = str_replace('http://localhost:8000', '', $truck->profile_photo);
                $updated = true;
            }

            // Fix Gallery
            if ($truck->gallery) {
                $gallery = $truck->gallery;
                $galleryUpdated = false;
                foreach ($gallery as &$item) {
                    if (isset($item['data'])) {
                        if (str_contains($item['data'], 'http://localhost:8001')) {
                            $item['data'] = str_replace('http://localhost:8001', '', $item['data']);
                            $galleryUpdated = true;
                        }
                        if (str_contains($item['data'], 'http://localhost:8000')) {
                            $item['data'] = str_replace('http://localhost:8000', '', $item['data']);
                            $galleryUpdated = true;
                        }
                    }
                }
                if ($galleryUpdated) {
                    $truck->gallery = $gallery;
                    $updated = true;
                }
            }

            if ($updated) {
                $truck->save();
                $this->info("Fixed URLs for Truck ID: {$truck->id}");
                $count++;
            }
        }
        $this->info("Fixed {$count} tow trucks.");
    }
}
