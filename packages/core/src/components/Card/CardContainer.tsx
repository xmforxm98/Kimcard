import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CardContext } from './context';
import { CardProps } from './types';
import { THEMES } from './themes';

export const CardContainer: React.FC<CardProps> = ({
    children,
    width = 300,
    height = 460,
    className = '',
    interactive = true,
    element = 'void', // Default element
}) => {
    const [hovered, setHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const theme = THEMES[element] || THEMES.void;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!interactive) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x, y });
    };

    return (
        <CardContext.Provider value={{ hovered, mousePos, element }}>
            <motion.div
                className={`relative ${className}`}
                style={{
                    width,
                    height,
                    perspective: 1200,
                }}
                onMouseEnter={() => interactive && setHovered(true)}
                onMouseLeave={() => {
                    if (!interactive) return;
                    setHovered(false);
                    setMousePos({ x: 0, y: 0 });
                }}
                onMouseMove={handleMouseMove}
                // Idle Animation: Breathing scale
                animate={{
                    scale: hovered ? 1 : [1, 1.01, 1],
                }}
                transition={{
                    scale: {
                        repeat: Infinity,
                        duration: 4,
                        ease: "easeInOut"
                    }
                }}
            >
                <motion.div
                    className="w-full h-full rounded-2xl relative"
                    style={{
                        transformStyle: 'preserve-3d',
                        background: theme.colors.bg,
                        border: '1px solid transparent',
                    }}
                    animate={interactive ? {
                        rotateY: mousePos.x * 15,
                        rotateX: -mousePos.y * 15,
                        scale: hovered ? 1.05 : 1,
                        y: hovered ? -15 : 0,
                    } : {}}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                        mass: 0.8,
                    }}
                >
                    {/* User Requested: "Hover 시 속성 컬러 Glow가 폭발하듯 퍼져야 함" */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        animate={{
                            boxShadow: hovered
                                ? `0 0 50px 10px ${theme.colors.glow}, 0 0 100px 30px ${theme.colors.glow}` // Explosion
                                : `0 10px 30px -10px rgba(0,0,0,0.8), inset 0 0 20px ${theme.colors.glow}`, // Idle Glow
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{ zIndex: 0 }}
                    />

                    {/* Gradient Border for Theme Identity */}
                    <div
                        className="absolute inset-0 p-[2px] rounded-2xl pointer-events-none z-50"
                        style={{
                            background: theme.colors.border,
                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                            maskComposite: 'exclude',
                            opacity: 0.8
                        }}
                    />

                    {/* Content Layer */}
                    <div className="relative w-full h-full z-10">
                        {children}
                    </div>

                </motion.div>
            </motion.div>
        </CardContext.Provider>
    );
};
