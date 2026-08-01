<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="ltr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#6366f1">

    {{-- SEO --}}
    <meta name="description" content="Hospital Management System — Manage patients, appointments, billing, lab, IPD and more.">
    <meta property="og:title" content="Hospital Management System">
    <meta property="og:description" content="Comprehensive HMS for managing patients, appointments, billing, lab tests, and inpatient care.">
    <meta property="og:type" content="website">

    <title>Hospital Management System</title>

    {{-- Preconnect for faster Google Fonts if used --}}
    <link rel="preconnect" href="https://fonts.bunny.net">

    {{-- Vite handles CSS + JS with cache-busted hashed filenames from public/build/manifest.json --}}
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])
</head>
<body class="antialiased">
    {{-- React SPA mount point --}}
    <div id="root" role="main"></div>

    {{-- Noscript fallback for accessibility --}}
    <noscript>
        <div style="padding: 2rem; font-family: sans-serif; text-align: center;">
            <strong>JavaScript is required</strong> to run the Hospital Management System.
            Please enable JavaScript in your browser settings.
        </div>
    </noscript>
<!-- impeccable-live-start -->
<script src="http://localhost:8400/live.js"></script>
<!-- impeccable-live-end -->
</body>
</html>
