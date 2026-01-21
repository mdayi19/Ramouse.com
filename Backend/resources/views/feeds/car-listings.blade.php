<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>Ramouse.com - Latest Car Listings in Syria</title>
    <link href="{{ url('/feed/car-listings.xml') }}" rel="self" />
    <link href="{{ url('/car-marketplace') }}" />
    <id>{{ url('/feed/car-listings.xml') }}</id>
    <updated>{{ $listings->first()?->updated_at->toAtomString() ?? now()->toAtomString() }}</updated>
    <author>
        <name>Ramouse.com</name>
        <uri>https://ramouse.com</uri>
    </author>
    <subtitle>Real-time feed of car listings for sale in Syria</subtitle>

    @foreach($listings as $listing)
    <entry>
        <title>{{ $listing->title }}</title>
        <link href="{{ url('/car-listings/' . $listing->slug) }}" />
        <id>{{ url('/entity/car-listing/' . $listing->id) }}</id>
        <updated>{{ $listing->updated_at->toAtomString() }}</updated>
        <published>{{ $listing->created_at->toAtomString() }}</published>
        
        <summary type="text">
            {{ $listing->brand?->name }} {{ $listing->model }} {{ $listing->year }} - {{ ucfirst($listing->condition) }} condition. 
            Price: ${{ number_format($listing->price) }} USD. 
            Location: {{ $listing->city }}, Syria. 
            Mileage: {{ number_format($listing->mileage) }} km. 
            {{ $listing->transmission }} transmission, {{ $listing->fuel_type }} fuel.
        </summary>
        
        <content type="html"><![CDATA[
            <h2>{{ $listing->title }}</h2>
            <p><strong>Price:</strong> ${{ number_format($listing->price) }} USD</p>
            <p><strong>Location:</strong> {{ $listing->city }}, Syria</p>
            <p><strong>Condition:</strong> {{ ucfirst($listing->condition) }}</p>
            <p><strong>Year:</strong> {{ $listing->year }}</p>
            <p><strong>Mileage:</strong> {{ number_format($listing->mileage) }} km</p>
            <p><strong>Transmission:</strong> {{ ucfirst($listing->transmission) }}</p>
            <p><strong>Fuel Type:</strong> {{ ucfirst($listing->fuel_type) }}</p>
            <p><strong>Doors:</strong> {{ $listing->doors_count }} | <strong>Seats:</strong> {{ $listing->seats_count }}</p>
            <p><strong>Color:</strong> {{ $listing->exterior_color }}</p>
            
            @if($listing->description)
            <h3>Description</h3>
            <p>{{ $listing->description }}</p>
            @endif
            
            @if($listing->photos && is_array($listing->photos))
                @foreach($listing->photos as $photo)
                <img src="{{ asset('storage/' . $photo) }}" alt="{{ $listing->title }}" style="max-width: 600px; margin: 10px 0;" />
                @endforeach
            @endif
            
            <p><strong>Seller:</strong> {{ $listing->owner?->name }}</p>
            <p><strong>Contact:</strong> {{ $listing->contact_phone }}</p>
        ]]></content>
        
        <category term="{{ $listing->brand?->name }}" />
        <category term="{{ $listing->city }}" />
        <category term="{{ $listing->listing_type }}" />
        <category term="{{ $listing->condition }}" />
        <category term="Syria" />
        
        <link rel="alternate" 
              type="application/ld+json" 
              href="{{ url('/entity/car-listing/' . $listing->id . '/metadata') }}" 
              title="Structured Data" />
    </entry>
    @endforeach
</feed>
