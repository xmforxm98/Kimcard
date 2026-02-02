// Theme definitions for the 5 Elemental Types

export type ElementType = 'fire' | 'ice' | 'volt' | 'earth' | 'void';

export const THEMES = {
    fire: {
        label: 'Inferno',
        colors: {
            bg: 'linear-gradient(135deg, #450a0a, #7f1d1d)',
            border: 'linear-gradient(45deg, #fca5a5, #ef4444)',
            glow: 'rgba(239, 68, 68, 0.6)',
            text: '#fca5a5',
        },
        vfx: 'rise'
    },
    ice: {
        label: 'Glacier',
        colors: {
            bg: 'linear-gradient(135deg, #083344, #155e75)',
            border: 'linear-gradient(45deg, #a5f3fc, #22d3ee)',
            glow: 'rgba(34, 211, 238, 0.6)',
            text: '#a5f3fc',
        },
        vfx: 'flow'
    },
    volt: {
        label: 'Thunder',
        colors: {
            bg: 'linear-gradient(135deg, #2e1065, #4c1d95)',
            border: 'linear-gradient(45deg, #f0abfc, #d946ef)',
            glow: 'rgba(217, 70, 239, 0.6)',
            text: '#f0abfc',
        },
        vfx: 'flicker'
    },
    earth: {
        label: 'Gaia',
        colors: {
            bg: 'linear-gradient(135deg, #14532d, #1a2e05)',
            border: 'linear-gradient(45deg, #bef264, #65a30d)',
            glow: 'rgba(101, 163, 13, 0.6)',
            text: '#bef264',
        },
        vfx: 'float'
    },
    void: {
        label: 'Abyss',
        colors: {
            bg: 'linear-gradient(135deg, #020617, #000000)',
            border: 'linear-gradient(45deg, #a855f7, #6b21a8)',
            glow: 'rgba(168, 85, 247, 0.5)',
            text: '#d8b4fe',
        },
        vfx: 'pulse'
    }
};
