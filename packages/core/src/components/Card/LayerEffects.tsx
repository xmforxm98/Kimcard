import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LayerEffectsProps } from './types';
import { useCardContext } from './context';

// Vertex Shader - Standard UV mapping
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader - Sheen
const sheenFragmentShader = `
  uniform float uTime;
  uniform float uHover;
  varying vec2 vUv;

  vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
  }

  void main() {
    // Transparent base
    vec4 texColor = vec4(0.0, 0.0, 0.0, 0.0);
    
    // Sheen params
    float speed = 0.4 + uHover * 0.6;
    float intensity = 0.3 + uHover * 0.4;
    
    // Diagonal line
    float diagonal = (vUv.x + vUv.y) * 0.5;
    float sheenPos = fract(uTime * speed);
    
    float sheenWidth = 0.15;
    float dist = abs(diagonal - sheenPos);
    float wrappedDist = min(dist, 1.0 - dist);
    float sheen = smoothstep(sheenWidth, 0.0, wrappedDist);
    
    // Rainbow color
    float hue = fract(diagonal * 2.0 + uTime * 0.1);
    vec3 rainbowColor = hsl2rgb(hue, 0.8, 0.6);
    
    // Secondary sheen
    float diagonal2 = (vUv.x - vUv.y + 1.0) * 0.5;
    float sheenPos2 = fract(uTime * speed * 0.7 + 0.5);
    float dist2 = abs(diagonal2 - sheenPos2);
    float wrappedDist2 = min(dist2, 1.0 - dist2);
    float sheen2 = smoothstep(sheenWidth * 0.7, 0.0, wrappedDist2) * 0.5;
    
    vec3 sheenColor = rainbowColor * sheen * intensity;
    vec3 sheenColor2 = hsl2rgb(fract(hue + 0.5), 0.7, 0.5) * sheen2 * intensity;
    
    // Final RGB
    vec3 finalColor = sheenColor + sheenColor2;
    float alpha = length(finalColor); // Alpha based on brightness
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

function SheenPlane() {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const { hovered } = useCardContext();

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uHover: { value: 0 },
    }), []);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            const targetHover = hovered ? 1 : 0;
            materialRef.current.uniforms.uHover.value +=
                (targetHover - materialRef.current.uniforms.uHover.value) * 0.1;
        }
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[2, 3]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={sheenFragmentShader}
                uniforms={uniforms}
                transparent={true}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </mesh>
    );
}

export const LayerEffects: React.FC<LayerEffectsProps> = ({
    type = 'sheen',
    className = '',
    zIndex = 20,
}) => {
    if (type === 'none') return null;

    return (
        <div className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} style={{ zIndex }}>
            <Canvas
                dpr={[1, 2]}
                camera={{ position: [0, 0, 2.5], fov: 50 }}
                gl={{ alpha: true, preserveDrawingBuffer: true }}
            >
                <SheenPlane />
            </Canvas>

            {/* Overlay reflection helper */}
            <OverlayReflection />
        </div>
    );
};

// Simple Overlay Reflection component based on context
const OverlayReflection = () => {
    const { hovered, mousePos } = useCardContext();

    return (
        // We can't render HTML inside Canvas easily without Html component, 
        // but since this is inside LayerEffects div, we can use absolute positioning relative to parent div
        // However, Canvas is creating a new stacking context.
        // Better to return nothing here and handle HTML overlays in parent if needed.
        // For now, let's keep it pure shader implementation.
        <></>
    );
};
