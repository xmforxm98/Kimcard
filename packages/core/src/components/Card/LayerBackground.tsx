import React from 'react';
import { LayerBackgroundProps } from './types';

export const LayerBackground: React.FC<LayerBackgroundProps> = ({
    type = 'gradient',
    src,
    color,
    className = '',
    zIndex = 0,
}) => {
    const getStyle = () => {
        if (type === 'image' && src) {
            return { backgroundImage: `url(${src})` };
        }
        if (type === 'solid' && color) {
            return { backgroundColor: color };
        }
        // Default premium void gradient
        return { background: 'radial-gradient(circle at 50% 0%, #2e1065 0%, #0f172a 60%, #020617 100%)' };
    };

    return (
        <div
            className={`absolute inset-0 w-full h-full bg-cover bg-center ${className}`}
            style={{
                zIndex,
                ...getStyle(),
            }}
        >
            {/* Noise Texture Overlay for realism */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
        </div>
    );
};
