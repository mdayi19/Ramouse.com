
try {
    const response = await fetch('/api/car-listings');
    const data = await response.json();
    console.log('Car Listings:', data.success, data.listings?.data?.length);
} catch (e) {
    console.error('Car Listings Error:', e.message);
}

try {
    const response2 = await fetch('/api/rent-car?listing_type=rent');
    const data2 = await response2.json();
    console.log('Rent Car:', data2.success, data2.listings?.data?.length);
} catch (e) {
    console.error('Rent Car Error:', e.message);
}
