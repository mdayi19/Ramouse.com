# Queue-Based Broadcasting Setup

## Overview
The notification system now uses **queue-based broadcasting** for better scalability. This allows the system to handle thousands of concurrent users efficiently.

## How It Works
1. When a notification is sent, it's added to the queue (database)
2. The queue worker picks it up and broadcasts it via Reverb
3. Users receive the notification in real-time via WebSocket

## Running the Queue Worker

### Option 1: Using the Batch File (Recommended)
Double-click `start-queue-worker.bat` in the Backend directory.

### Option 2: Manual Command
```bash
cd Backend
php artisan queue:work --queue=default --tries=3 --timeout=90
```

## Important Notes
- **You MUST run the queue worker** for real-time notifications to work
- The worker should run continuously alongside `php artisan serve` and `php artisan reverb:start`
- If the worker stops, notifications will queue up but won't be sent until it's restarted

## All Required Services
To run the application, you need **4 terminal windows**:

1. **Backend Server**: `php artisan serve`
2. **Reverb Server**: `php artisan reverb:start`
3. **Queue Worker**: `php artisan queue:work` (NEW!)
4. **Frontend**: `npm run dev`

## Monitoring the Queue
To see pending jobs:
```bash
php artisan queue:monitor
```

To see failed jobs:
```bash
php artisan queue:failed
```

To retry failed jobs:
```bash
php artisan queue:retry all
```

## Production Deployment
For production, use a process manager like Supervisor to keep the queue worker running:

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/ramouse/Backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
numprocs=3
```

## Benefits
✅ Handles thousands of concurrent users
✅ Non-blocking - doesn't slow down the main application
✅ Automatic retry on failure
✅ Better resource management
✅ Scalable architecture
