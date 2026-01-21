{!! '<?xml version="1.0" encoding="UTF-8"?>' !!}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
@foreach($listings as $listing)
    <url>
        <loc>{{ url('/car-listings/' . $listing->slug) }}</loc>
        <lastmod>{{ $listing->updated_at->toAtomString() }}</lastmod>
        <changefreq>{{ $listing->is_sponsored ? 'daily' : 'weekly' }}</changefreq>
        <priority>{{ $listing->is_featured ? '1.0' : '0.8' }}</priority>
        
        @if($listing->photos && is_array($listing->photos))
            @foreach($listing->photos as $photo)
            <image:image>
                <image:loc>{{ asset('storage/' . $photo) }}</image:loc>
                <image:title>{{ $listing->title }} - Rental</image:title>
                <image:caption>{{ $listing->brand?->name }} {{ $listing->model }} - Car Rental in {{ $listing->city }}, Syria</image:caption>
            </image:image>
            @endforeach
        @endif
        
        <xhtml:link rel="alternate" 
                    type="application/ld+json" 
                    href="{{ url('/entity/car-listing/' . $listing->id . '/metadata') }}" />
    </url>
@endforeach
</urlset>
