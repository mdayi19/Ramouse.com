{!! '<?xml version="1.0" encoding="UTF-8"?>' !!}
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>Ramouse.com - Latest Car Rentals in Syria</title>
    <link href="{{ url('/feed/car-rentals.xml') }}" rel="self" />
    <link href="{{ url('/rent-car') }}" />
    <id>{{ url('/feed/car-rentals.xml') }}</id>
    <updated>{{ $listings->first()?->updated_at->toAtomString() ?? now()->toAtomString() }}</updated>
    <author>
        <name>Ramouse.com</name>
        <uri>https://ramouse.com</uri>
    </author>
    <subtitle>Real-time feed of car rental listings in Syria</subtitle>

    @foreach($listings as $listing)
    <entry>
        <title>{{ $listing->title }} - Rental</title>
        <link href="{{ url('/car-listings/' . $listing->slug) }}" />
        <id>{{ url('/entity/car-listing/' . $listing->id) }}</id>
        <updated>{{ $listing->updated_at->toAtomString() }}</updated>
        <published>{{ $listing->created_at->toAtomString() }}</published>
        
        <summary type="text">
            {{ $listing->brand?->name }} {{ $listing->model }} {{ $listing->year }} available for rent in {{ $listing->city }}, Syria.
            @if(isset($listing->rental_terms['daily_rate']))
            Daily rate: ${{ number_format($listing->rental_terms['daily_rate']) }} USD.
            @endif
            {{ $listing->transmission }} transmission, {{ $listing->fuel_type }} fuel.
        </summary>
        
        <content type="html"><![CDATA[
            <h2>{{ $listing->title }} - Car Rental</h2>
            <p><strong>Location:</strong> {{ $listing->city }}, Syria</p>
            
            @if(isset($listing->rental_terms))
            <h3>Rental Rates</h3>
            <ul>
                @if(isset($listing->rental_terms['daily_rate']))
                <li><strong>Daily:</strong> ${{ number_format($listing->rental_terms['daily_rate']) }} USD</li>
                @endif
                @if(isset($listing->rental_terms['weekly_rate']))
                <li><strong>Weekly:</strong> ${{ number_format($listing->rental_terms['weekly_rate']) }} USD</li>
                @endif
                @if(isset($listing->rental_terms['monthly_rate']))
                <li><strong>Monthly:</strong> ${{ number_format($listing->rental_terms['monthly_rate']) }} USD</li>
                @endif
            </ul>
            @endif
            
            <h3>Vehicle Details</h3>
            <p><strong>Year:</strong> {{ $listing->year }}</p>
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
            
            <p><strong>Provider:</strong> {{ $listing->owner?->name }}</p>
            <p><strong>Contact:</strong> {{ $listing->contact_phone }}</p>
        ]]></content>
        
        <category term="{{ $listing->brand?->name }}" />
        <category term="{{ $listing->city }}" />
        <category term="rental" />
        <category term="Syria" />
        
        <link rel="alternate" 
              type="application/ld+json" 
              href="{{ url('/entity/car-listing/' . $listing->id . '/metadata') }}" 
              title="Structured Data" />
    </entry>
    @endforeach
</feed>
