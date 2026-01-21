<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
@foreach($providers as $provider)
    <url>
        <loc>{{ url('/car-providers/' . $provider->id) }}</loc>
        <lastmod>{{ $provider->updated_at->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>{{ $provider->is_trusted ? '0.9' : '0.7' }}</priority>
        
        @if($provider->profile_photo)
        <image:image>
            <image:loc>{{ asset('storage/' . $provider->profile_photo) }}</image:loc>
            <image:title>{{ $provider->name }}</image:title>
            <image:caption>{{ $provider->name }} - Car Dealer in {{ $provider->city }}, Syria</image:caption>
        </image:image>
        @endif
        
        <xhtml:link rel="alternate" 
                    type="application/ld+json" 
                    href="{{ url('/entity/car-provider/' . $provider->id . '/metadata') }}" />
    </url>
@endforeach
</urlset>
