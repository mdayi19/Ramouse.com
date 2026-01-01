@echo off
echo Starting Laravel Queue Worker for Broadcasting...
echo.
echo This worker will process broadcasting events in the background.
echo Press Ctrl+C to stop the worker.
echo.
php artisan queue:work --queue=default --tries=3 --timeout=90
