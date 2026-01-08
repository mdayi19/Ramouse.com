<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Primary Meta Tags -->
    <title>{{ $title }} | Ramouse.com</title>
    <meta name="title" content="{{ $title }}">
    <meta name="description" content="{{ $description }}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="{{ $url }}">
    <meta property="og:title" content="{{ $title }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:image" content="{{ $image }}">
    <meta property="og:image:alt" content="{{ $title }}">
    <meta property="og:site_name" content="Ramouse.com">
    <meta property="og:locale" content="ar_SY">

    <!-- Product Specific -->
    <meta property="product:price:amount" content="{{ $listing->price ?? $listing->daily_rate }}">
    <meta property="product:price:currency" content="SYP">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ $url }}">
    <meta property="twitter:title" content="{{ $title }}">
    <meta property="twitter:description" content="{{ $description }}">
    <meta property="twitter:image" content="{{ $image }}">

    <!-- Redirect to React SPA for human visitors -->
    <meta http-equiv="refresh" content="0;url={{ $url }}">
    <script>
        // Immediate redirect for browsers
        window.location.href = "{{ $url }}";
    </script>
</head>

<body>
    <!-- Fallback content for crawlers -->
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>{{ $title }}</h1>
        <img src="{{ $image }}" alt="{{ $title }}" style="max-width: 600px; height: auto;">
        <p>{{ $description }}</p>
        <p><strong>السعر: {{ $price }}</strong></p>
        <p><a href="{{ $url }}">عرض التفاصيل</a></p>
    </div>
</body>

</html>