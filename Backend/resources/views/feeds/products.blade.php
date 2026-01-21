{!! '<?xml version="1.0" encoding="UTF-8"?>' !!}
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>Ramouse.com - Latest Car Parts & Accessories in Syria</title>
    <link href="{{ url('/feed/products.xml') }}" rel="self" />
    <link href="{{ url('/store/products') }}" />
    <id>{{ url('/feed/products.xml') }}</id>
    <updated>{{ $products->first()?->updated_at->toAtomString() ?? now()->toAtomString() }}</updated>
    <author>
        <name>Ramouse.com</name>
        <uri>https://ramouse.com</uri>
    </author>
    <subtitle>Real-time feed of car parts and accessories available in Syria</subtitle>

    @foreach($products as $product)
    <entry>
        <title>{{ $product->name }}</title>
        <link href="{{ url('/store/products/' . $product->id) }}" />
        <id>{{ url('/entity/product/' . $product->id) }}</id>
        <updated>{{ $product->updated_at->toAtomString() }}</updated>
        <published>{{ $product->created_at->toAtomString() }}</published>
        
        <summary type="text">
            {{ $product->name }} - {{ $product->category?->name }}. 
            Price: ${{ number_format($product->price) }} USD. 
            {{ $product->total_stock > 0 ? 'In Stock' : 'Out of Stock' }}.
        </summary>
        
        <content type="html"><![CDATA[
            <h2>{{ $product->name }}</h2>
            <p><strong>Category:</strong> {{ $product->category?->name }}</p>
            <p><strong>Price:</strong> ${{ number_format($product->price) }} USD</p>
            <p><strong>Stock:</strong> {{ $product->total_stock > 0 ? $product->total_stock . ' units available' : 'Out of Stock' }}</p>
            
            @if($product->description)
            <h3>Description</h3>
            <p>{{ $product->description }}</p>
            @endif
            
            @if(is_array($product->media) && count($product->media) > 0)
                @foreach($product->media as $image)
                <img src="{{ asset('storage/' . $image) }}" alt="{{ $product->name }}" style="max-width: 600px; margin: 10px 0;" />
                @endforeach
            @endif
            
            @if($product->average_rating)
            <p><strong>Rating:</strong> {{ $product->average_rating }}/5</p>
            @endif
        ]]></content>
        
        <category term="{{ $product->category?->name }}" />
        <category term="car-parts" />
        <category term="Syria" />
        
        <link rel="alternate" 
              type="application/ld+json" 
              href="{{ url('/entity/product/' . $product->id . '/metadata') }}" 
              title="Structured Data" />
    </entry>
    @endforeach
</feed>
