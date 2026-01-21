<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
@foreach($products as $product)
    <url>
        <loc>{{ url('/store/products/' . $product->id) }}</loc>
        <lastmod>{{ $product->updated_at->toAtomString() }}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.6</priority>
        
        @if(is_array($product->media) && count($product->media) > 0)
            @foreach($product->media as $image)
            <image:image>
                <image:loc>{{ asset('storage/' . $image) }}</image:loc>
                <image:title>{{ $product->name }}</image:title>
                <image:caption>{{ $product->name }} - {{ $product->category?->name }} - Car Parts Syria</image:caption>
            </image:image>
            @endforeach
        @endif
        
        <xhtml:link rel="alternate" 
                    type="application/ld+json" 
                    href="{{ url('/entity/product/' . $product->id . '/metadata') }}" />
    </url>
@endforeach
</urlset>
