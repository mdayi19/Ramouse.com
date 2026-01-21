<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth', 'storage/*'],

    'allowed_methods' => ['*'],

    // Always allow both production and dev origins for local development
    'allowed_origins' => [
        'https://ramouse.com',
        'https://www.ramouse.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        // Search Engine Tools
        'https://www.bing.com',
        'https://webmaster.bing.com',
        'https://search.google.com',
        'https://www.google.com',

        // AI & LLM Tools
        'https://chat.openai.com',
        'https://chatgpt.com',
        'https://claude.ai',
        'https://bard.google.com',
        'https://gemini.google.com',
        'https://www.perplexity.ai',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,
];
