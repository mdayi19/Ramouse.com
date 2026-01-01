/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                'sans': ['Tajawal', 'sans-serif'],
            },
            colors: {
                primary: {
                    DEFAULT: '#1c2e5b',
                    '50': '#ebf0ff',
                    '100': '#dce6ff',
                    '200': '#c2d4ff',
                    '300': '#9ebaff',
                    '400': '#759aff',
                    '500': '#4e7aff',
                    '600': '#2952ff',
                    '700': '#1c2e5b', // Base
                    '800': '#162345',
                    '900': '#121d36',
                    '950': '#0a101f',
                },
                secondary: {
                    DEFAULT: '#f0b71a',
                    '50': '#fffbea',
                    '100': '#fff4c5',
                    '200': '#ffea85',
                    '300': '#ffda46',
                    '400': '#f0b71a', // Base
                    '500': '#d99d08',
                    '600': '#b67a05',
                    '700': '#8e5806',
                    '800': '#75460a',
                    '900': '#63390f',
                },
                light: 'rgb(248 250 252)',
                darkbg: 'rgb(15 23 42)',
                darkcard: 'rgb(30 41 59)',
                cream: '#f3efe4', // Brand Accent
            },
            keyframes: {
                'toast-in': {
                    'from': { transform: 'translateY(-20px) translateX(100%)', opacity: '0' },
                    'to': { transform: 'translateY(0) translateX(0)', opacity: '1' },
                },
                'modal-in': {
                    'from': { transform: 'scale(0.95)', opacity: '0' },
                    'to': { transform: 'scale(1)', opacity: '1' },
                },
                'modal-out': {
                    'from': { transform: 'scale(1)', opacity: '1' },
                    'to': { transform: 'scale(0.95)', opacity: '0' },
                },
                'fade-in': {
                    'from': { opacity: '0' },
                    'to': { opacity: '1' },
                },
                'slide-up': {
                    'from': { transform: 'translateY(20px)', opacity: '0' },
                    'to': { transform: 'translateY(0)', opacity: '1' },
                },
                'fade-in-up': {
                    'from': { transform: 'translateY(10px)', opacity: '0' },
                    'to': { transform: 'translateY(0)', opacity: '1' },
                },
                'fade-in-down': {
                    'from': { transform: 'translateY(-10px)', opacity: '0' },
                    'to': { transform: 'translateY(0)', opacity: '1' },
                },
                'bounce-subtle': {
                    '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
                    '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
                }
            },
            animation: {
                'toast-in': 'toast-in 0.3s ease-out forwards',
                'modal-in': 'modal-in 0.2s ease-out forwards',
                'modal-out': 'modal-out 0.2s ease-in forwards',
                'fade-in': 'fade-in 0.3s ease-out forwards',
                'fade-in-up': 'fade-in-up 0.4s ease-out both',
                'fade-in-down': 'fade-in-down 0.4s ease-out both',
                'slide-up': 'slide-up 0.4s ease-out forwards',
                'bounce-subtle': 'bounce-subtle 2s infinite',
            }
        }
    },
    plugins: [],
}
