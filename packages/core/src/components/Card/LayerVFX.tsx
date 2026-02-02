import React from 'react';
import { LayerVFXProps } from './types';
import { useCardContext } from './context';

export const LayerVFX: React.FC<LayerVFXProps> = ({
    element,
    className = '',
    zIndex = 20,
}) => {
    const { hovered } = useCardContext();

    // "Static is Bug" - Always animate, intensify on hover

    return (
        <div
            className={`absolute inset-0 pointer-events-none overflow-hidden rounded-2xl ${className}`}
            style={{ zIndex }}
        >
            {/* FIRE VFX */}
            {element === 'fire' && (
                <div className="w-full h-full relative mix-blend-screen transition-opacity duration-300" style={{ opacity: hovered ? 0.9 : 0.6 }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent animate-pulse-slow" />
                    {/* Rising Particles */}
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute bottom-0 w-2 h-2 bg-orange-400 rounded-full blur-[2px] animate-rise"
                            style={{
                                left: `${20 + i * 15}%`,
                                animationDelay: `${i * 0.5}s`,
                                animationDuration: hovered ? `${1 + i * 0.2}s` : `${2 + i * 0.5}s` // Faster on hover
                            }}
                        />
                    ))}
                </div>
            )}

            {/* ICE VFX */}
            {element === 'ice' && (
                <div className="w-full h-full relative mix-blend-overlay transition-opacity duration-500" style={{ opacity: hovered ? 0.8 : 0.5 }}>
                    <div
                        className="absolute inset-[-50%] w-[200%] h-[200%] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] animate-drift"
                        style={{ opacity: 0.3 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-300/10 to-blue-500/20 animate-pulse-slow" />
                </div>
            )}

            {/* VOLT VFX */}
            {element === 'volt' && (
                <div className="w-full h-full relative mix-blend-color-dodge transition-opacity duration-100" style={{ opacity: hovered ? 1 : 0.7 }}>
                    <div className={`absolute inset-0 border-2 border-fuchsia-500/30 opacity-0 animate-flicker rounded-2xl ${hovered ? 'animate-[flicker_0.1s_infinite]' : 'animate-flicker'}`} />
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-yellow-300 blur-[1px] opacity-0 animate-[flicker_3s_infinite]" />
                </div>
            )}

            {/* EARTH VFX */}
            {element === 'earth' && (
                <div className="w-full h-full relative transition-opacity duration-700" style={{ opacity: hovered ? 0.9 : 0.6 }}>
                    {/* Floating Spores */}
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-lime-300 rounded-full animate-float"
                            style={{
                                left: `${Math.random() * 80 + 10}%`,
                                top: `${Math.random() * 80 + 10}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: hovered ? `${2 + Math.random()}s` : `${4 + Math.random() * 2}s` // Faster float
                            }}
                        />
                    ))}
                </div>
            )}

            {/* VOID VFX */}
            {element === 'void' && (
                <div className="w-full h-full relative mix-blend-exclusion transition-opacity duration-300" style={{ opacity: hovered ? 1 : 0.8 }}>
                    <div className="absolute inset-0 bg-purple-900/40 animate-pulse-slow" />
                    <div
                        className="absolute inset-[20%] border border-purple-500/30 rounded-full"
                        style={{
                            animation: `spin ${hovered ? '2s' : '10s'} linear infinite` // Faster spin
                        }}
                    />
                </div>
            )}
        </div>
    );
};
