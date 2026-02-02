import React from 'react';
import { LayerCharacterProps } from './types';

export const LayerCharacter: React.FC<LayerCharacterProps> = ({
    src,
    alt = 'Character',
    scale = 1,
    offsetX = 0,
    offsetY = 0,
    className = '',
    zIndex = 10,
}) => {
    return (
        <div
            className={`absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none ${className}`}
            style={{ zIndex }}
        >
            <img
                src={src}
                alt={alt}
                className="max-h-full max-w-full object-contain transition-transform duration-500 ease-out will-change-transform"
                style={{
                    transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`,
                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))', // Add depth
                }}
            />
        </div>
    );
};
