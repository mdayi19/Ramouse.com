<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Handle file upload for images, videos, and audio files
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        // Get dynamic limits from settings
        $limitSettings = \App\Models\SystemSettings::getSetting('limitSettings');
        $maxImageSizeMB = $limitSettings['maxImageSizeMB'] ?? 5;
        $maxVideoSizeMB = $limitSettings['maxVideoSizeMB'] ?? 50;
        $maxVoiceNoteSizeMB = $limitSettings['maxVoiceNoteSizeMB'] ?? 5;

        // Pre-validate file exists
        if (!$request->hasFile('file')) {
            return response()->json([
                'success' => false,
                'message' => 'No file provided'
            ], 400);
        }

        $file = $request->file('file');
        $mimeType = $file->getMimeType();

        // Determine max size based on file type
        if (str_starts_with($mimeType, 'image/')) {
            $maxSizeKB = $maxImageSizeMB * 1024;
        } elseif (str_starts_with($mimeType, 'video/')) {
            $maxSizeKB = $maxVideoSizeMB * 1024;
        } elseif (str_starts_with($mimeType, 'audio/')) {
            $maxSizeKB = $maxVoiceNoteSizeMB * 1024;
        } else {
            $maxSizeKB = 51200; // Default 50MB for other files
        }

        $request->validate([
            'file' => "required|file|max:{$maxSizeKB}",
        ]);

        try {
            $file = $request->file('file');

            // Generate unique filename
            $extension = $file->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $extension;

            // Determine subfolder based on file type
            $mimeType = $file->getMimeType();
            $folder = 'uploads/';

            if (str_starts_with($mimeType, 'image/')) {
                $folder .= 'images';
            } elseif (str_starts_with($mimeType, 'video/')) {
                $folder .= 'videos';
            } elseif (str_starts_with($mimeType, 'audio/')) {
                $folder .= 'audio';
            } else {
                $folder .= 'files';
            }

            // Store file in public disk
            $path = $file->storeAs($folder, $filename, 'public');

            // Generate public URL
            $url = Storage::url($path);

            return response()->json([
                'success' => true,
                'message' => 'File uploaded successfully',
                'data' => [
                    'filename' => $filename,
                    'path' => $path,
                    'url' => $url,
                    'full_url' => url($url),
                    'type' => $mimeType,
                    'size' => $file->getSize(),
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'File upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle multiple file uploads
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadMultiple(Request $request)
    {
        // Get dynamic limits from settings
        $limitSettings = \App\Models\SystemSettings::getSetting('limitSettings');
        $maxImageSizeMB = $limitSettings['maxImageSizeMB'] ?? 5;
        $maxVideoSizeMB = $limitSettings['maxVideoSizeMB'] ?? 50;
        $maxVoiceNoteSizeMB = $limitSettings['maxVoiceNoteSizeMB'] ?? 5;

        // Use the highest limit for validation (we'll check individual files below)
        $maxSizeKB = max($maxImageSizeMB, $maxVideoSizeMB, $maxVoiceNoteSizeMB) * 1024;

        $request->validate([
            'files' => 'required|array',
            'files.*' => "file|max:{$maxSizeKB}",
        ]);

        try {
            $uploadedFiles = [];

            foreach ($request->file('files') as $file) {
                $mimeType = $file->getMimeType();

                // Check individual file size against type-specific limit
                $fileSizeMB = $file->getSize() / 1024 / 1024;
                if (str_starts_with($mimeType, 'image/') && $fileSizeMB > $maxImageSizeMB) {
                    return response()->json([
                        'success' => false,
                        'message' => "حجم الصورة يتجاوز الحد المسموح ({$maxImageSizeMB}MB)"
                    ], 400);
                } elseif (str_starts_with($mimeType, 'video/') && $fileSizeMB > $maxVideoSizeMB) {
                    return response()->json([
                        'success' => false,
                        'message' => "حجم الفيديو يتجاوز الحد المسموح ({$maxVideoSizeMB}MB)"
                    ], 400);
                } elseif (str_starts_with($mimeType, 'audio/') && $fileSizeMB > $maxVoiceNoteSizeMB) {
                    return response()->json([
                        'success' => false,
                        'message' => "حجم الملاحظة الصوتية يتجاوز الحد المسموح ({$maxVoiceNoteSizeMB}MB)"
                    ], 400);
                }

                $extension = $file->getClientOriginalExtension();
                $filename = Str::uuid() . '.' . $extension;

                $mimeType = $file->getMimeType();
                $folder = 'uploads/';

                if (str_starts_with($mimeType, 'image/')) {
                    $folder .= 'images';
                } elseif (str_starts_with($mimeType, 'video/')) {
                    $folder .= 'videos';
                } elseif (str_starts_with($mimeType, 'audio/')) {
                    $folder .= 'audio';
                } else {
                    $folder .= 'files';
                }

                $path = $file->storeAs($folder, $filename, 'public');
                $url = Storage::url($path);

                $uploadedFiles[] = [
                    'filename' => $filename,
                    'path' => $path,
                    'url' => $url,
                    'full_url' => url($url),
                    'type' => $mimeType,
                    'size' => $file->getSize(),
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Files uploaded successfully',
                'data' => $uploadedFiles
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'File upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete uploaded file
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function delete(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        try {
            if (Storage::disk('public')->exists($request->path)) {
                Storage::disk('public')->delete($request->path);

                return response()->json([
                    'success' => true,
                    'message' => 'File deleted successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'File not found'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'File deletion failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
