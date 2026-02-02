/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    prefix: 'kc-', // kc- prefix for library components
    theme: {
        extend: {
            fontFamily: {
                fantasy: ['Cinzel', 'serif'],
                scifi: ['Orbitron', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
            colors: {
                // Elemental Colors
                fire: {
                    light: '#fca5a5', // red-300
                    main: '#ef4444',  // red-500
                    glow: '#991b1b',  // red-800
                },
                ice: {
                    light: '#a5f3fc', // cyan-200
                    main: '#06b6d4',  // cyan-500
                    glow: '#155e75',  // cyan-800
                },
                volt: {
                    light: '#fdf4ff', // fuchsia-50
                    main: '#d946ef',  // fuchsia-500
                    glow: '#701a75',  // fuchsia-900
                },
                earth: {
                    light: '#bef264', // lime-300
                    main: '#65a30d',  // lime-600
                    glow: '#1a2e05',  // lime-950
                },
                void: {
                    light: '#e9d5ff', // purple-200
                    main: '#6b21a8',  // purple-800
                    glow: '#3b0764',  // purple-950
                }
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'rise': 'rise 3s infinite linear',
                'drift': 'drift 8s infinite linear',
                'flicker': 'flicker 0.2s infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                rise: {
                    '0%': { transform: 'translateY(100%)', opacity: 0 },
                    '50%': { opacity: 0.5 },
                    '100%': { transform: 'translateY(-20%)', opacity: 0 },
                },
                drift: {
                    '0%': { backgroundPosition: '0% 50%' },
                    '100%': { backgroundPosition: '100% 50%' },
                },
                flicker: {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.8 },
                    '70%': { opacity: 0.95 },
                }
            }
        },
    },
    plugins: [],
}
