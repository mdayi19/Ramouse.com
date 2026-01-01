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
        $request->validate([
            'file' => 'required|file|max:51200', // Max 50MB
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
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'file|max:51200', // Max 50MB per file
        ]);

        try {
            $uploadedFiles = [];

            foreach ($request->file('files') as $file) {
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
