<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
@foreach($listings as $listing)
    <url>
        <loc>{{ config('app.url') }}/car-listings/{{ $listing->slug }}</loc>
        <lastmod>{{ $listing->updated_at->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
@if(is_array($listing->photos) && count($listing->photos) > 0)
@foreach(array_slice($listing->photos, 0, 3) as $photo)
        <image:image>
            <image:loc>{{ $photo }}</image:loc>
            <image:title>{{ $listing->title }}</image:title>
        </image:image>
@endforeach
@endif
    </url>
@endforeach
</urlset>
