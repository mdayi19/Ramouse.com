<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TowTruck;
use App\Models\Technician;

class FixImageUrls extends Command
{
    protected $signature = 'fix:image-urls';
    protected $description = 'Convert absolute image URLs to relative paths for portability';

    public function handle()
    {
        $this->info('Fixing TowTruck image URLs...');

        $towTrucks = TowTruck::all();
        $count = 0;

        foreach ($towTrucks as $truck) {
            $updated = false;

            // Fix profile photo
            if ($truck->profile_photo && (str_contains($truck->profile_photo, 'http://') || str_contains($truck->profile_photo, 'https://'))) {
                // Extract just the /storage/... part
                if (preg_match('/\/storage\/(.+)$/', $truck->profile_photo, $matches)) {
                    $truck->profile_photo = '/storage/' . $matches[1];
                    $updated = true;
                }
            }

            // Fix gallery
            if ($truck->gallery && is_array($truck->gallery)) {
                $fixedGallery = [];
                foreach ($truck->gallery as $item) {
                    if (isset($item['data']) && (str_contains($item['data'], 'http://') || str_contains($item['data'], 'https://'))) {
                        if (preg_match('/\/storage\/(.+)$/', $item['data'], $matches)) {
                            $item['data'] = '/storage/' . $matches[1];
                            $updated = true;
                        }
                    }
                    $fixedGallery[] = $item;
                }
                $truck->gallery = $fixedGallery;
            }

            if ($updated) {
                $truck->save();
                $count++;
                $this->line("Fixed: {$truck->name}");
            }
        }

        $this->info("Updated {$count} TowTruck records");

        // Do the same for Technicians
        $this->info('Fixing Technician image URLs...');
        $technicians = Technician::all();
        $count = 0;

        foreach ($technicians as $tech) {
            $updated = false;

            // Fix profile photo
            if ($tech->profile_photo && (str_contains($tech->profile_photo, 'http://') || str_contains($tech->profile_photo, 'https://'))) {
                if (preg_match('/\/storage\/(.+)$/', $tech->profile_photo, $matches)) {
                    $tech->profile_photo = '/storage/' . $matches[1];
                    $updated = true;
                }
            }

            // Fix gallery
            if ($tech->gallery && is_array($tech->gallery)) {
                $fixedGallery = [];
                foreach ($tech->gallery as $item) {
                    if (isset($item['data']) && (str_contains($item['data'], 'http://') || str_contains($item['data'], 'https://'))) {
                        if (preg_match('/\/storage\/(.+)$/', $item['data'], $matches)) {
                            $item['data'] = '/storage/' . $matches[1];
                            $updated = true;
                        }
                    }
                    $fixedGallery[] = $item;
                }
                $tech->gallery = $fixedGallery;
            }

            if ($updated) {
                $tech->save();
                $count++;
                $this->line("Fixed: {$tech->name}");
            }
        }

        $this->info("Updated {$count} Technician records");
        $this->info('✅ All image URLs have been fixed!');

        return 0;
    }
}
