export type CardLayerType = 'background' | 'character' | 'pose' | 'effects' | 'vfx';

import { ElementType } from './themes';

export interface CardProps {
    children?: React.ReactNode;
    width?: number | string;
    height?: number | string;
    className?: string;
    interactive?: boolean;
    element?: ElementType; // New prop for elemental theme
}

export interface LayerProps {
    className?: string;
    zIndex?: number;
}

export interface LayerBackgroundProps extends LayerProps {
    type?: 'gradient' | 'image' | 'solid';
    src?: string;
    color?: string;
    element?: ElementType; // Support element-based bg
}

export interface LayerCharacterProps extends LayerProps {
    src: string;
    alt?: string;
    scale?: number;
    offsetX?: number;
    offsetY?: number;
}

export interface LayerPoseProps extends LayerProps {
    variant: string;
}

export interface LayerEffectsProps extends LayerProps {
    type: 'sheen' | 'hologram' | 'burning' | 'none';
    intensity?: number;
    color?: string;
}

export interface LayerAdvancedVFXProps extends LayerProps {
    type: 'lightning' | 'aura';
    color?: string;
    intensity?: number;
    speed?: number;
}

// New VFX Layer Props
export interface LayerVFXProps extends LayerProps {
    element: ElementType;
}
