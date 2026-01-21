<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
@foreach($towTrucks as $towTruck)
    <url>
        <loc>{{ url('/tow-trucks/' . $towTruck->id) }}</loc>
        <lastmod>{{ $towTruck->updated_at->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
        
        @if($towTruck->profile_photo)
        <image:image>
            <image:loc>{{ asset('storage/' . $towTruck->profile_photo) }}</image:loc>
            <image:title>{{ $towTruck->name }}</image:title>
            <image:caption>{{ $towTruck->name }} - Tow Service in {{ $towTruck->city }}, Syria</image:caption>
        </image:image>
        @endif
        
        <xhtml:link rel="alternate" 
                    type="application/ld+json" 
                    href="{{ url('/entity/tow-truck/' . $towTruck->id . '/metadata') }}" />
    </url>
@endforeach
</urlset>
