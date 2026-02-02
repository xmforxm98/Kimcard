import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { TextureLoader } from 'three'

// Vertex Shader - Standard UV mapping
const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment Shader - Holographic Sheen Effect
const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uHover;
  varying vec2 vUv;
  
  // HSL to RGB conversion for rainbow effect
  vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
  }
  
  void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    
    // Base sheen parameters
    float speed = 0.4 + uHover * 0.6; // Speed increases on hover
    float intensity = 0.3 + uHover * 0.4; // Intensity increases on hover
    
    // Create diagonal sheen line (45 degree angle)
    float diagonal = (vUv.x + vUv.y) * 0.5;
    
    // Animate the sheen position
    float sheenPos = fract(uTime * speed);
    
    // Create sharp sheen band with soft edges
    float sheenWidth = 0.15;
    float dist = abs(diagonal - sheenPos);
    float wrappedDist = min(dist, 1.0 - dist); // Handle wrapping
    float sheen = smoothstep(sheenWidth, 0.0, wrappedDist);
    
    // Create rainbow/holographic color based on position and time
    float hue = fract(diagonal * 2.0 + uTime * 0.1);
    vec3 rainbowColor = hsl2rgb(hue, 0.8, 0.6);
    
    // Secondary sheen for more complexity (opposite direction)
    float diagonal2 = (vUv.x - vUv.y + 1.0) * 0.5;
    float sheenPos2 = fract(uTime * speed * 0.7 + 0.5);
    float dist2 = abs(diagonal2 - sheenPos2);
    float wrappedDist2 = min(dist2, 1.0 - dist2);
    float sheen2 = smoothstep(sheenWidth * 0.7, 0.0, wrappedDist2) * 0.5;
    
    // Combine sheens with rainbow colors
    vec3 sheenColor = rainbowColor * sheen * intensity;
    vec3 sheenColor2 = hsl2rgb(fract(hue + 0.5), 0.7, 0.5) * sheen2 * intensity;
    
    // Subtle base iridescence
    float iridescence = sin(vUv.x * 20.0 + vUv.y * 20.0 + uTime) * 0.03;
    vec3 iridColor = hsl2rgb(fract(vUv.x + vUv.y + uTime * 0.05), 0.5, 0.5) * iridescence;
    
    // Edge highlight
    float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float edgeGlow = smoothstep(0.1, 0.0, edgeDist) * 0.2 * uHover;
    vec3 edgeColor = vec3(0.8, 0.9, 1.0) * edgeGlow;
    
    // Final color composition (additive blending)
    vec3 finalColor = texColor.rgb + sheenColor + sheenColor2 + iridColor + edgeColor;
    
    // Slight desaturation of base to make sheen pop more
    float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    finalColor = mix(finalColor, vec3(luminance) + sheenColor + sheenColor2, 0.1);
    
    gl_FragColor = vec4(finalColor, texColor.a);
  }
`

// Shader Plane Component
function ShaderPlane({ hovered }: { hovered: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<THREE.ShaderMaterial>(null)

    // Load placeholder texture
    const texture = useLoader(
        TextureLoader,
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=512&h=768&fit=crop'
    )

    // Shader uniforms
    const uniforms = useMemo(() => ({
        uTexture: { value: texture },
        uTime: { value: 0 },
        uHover: { value: 0 },
    }), [texture])

    // Animation loop
    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
            // Smooth hover transition
            const targetHover = hovered ? 1 : 0
            materialRef.current.uniforms.uHover.value +=
                (targetHover - materialRef.current.uniforms.uHover.value) * 0.1
        }
    })

    return (
        <mesh ref={meshRef}>
            {/* Card aspect ratio 2:3 */}
            <planeGeometry args={[2, 3]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
            />
        </mesh>
    )
}

// Main SheenCard Component
export default function SheenCard() {
    const [hovered, setHovered] = useState(false)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        setMousePos({ x, y })
    }

    return (
        <motion.div
            className="relative cursor-pointer"
            style={{
                width: 280,
                height: 420,
                perspective: 1000,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false)
                setMousePos({ x: 0, y: 0 })
            }}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="w-full h-full rounded-xl overflow-hidden shadow-2xl"
                style={{
                    background: 'linear-gradient(145deg, #2a2a40, #1a1a2e)',
                    boxShadow: hovered
                        ? '0 25px 50px -12px rgba(139, 92, 246, 0.35), 0 0 60px rgba(139, 92, 246, 0.2)'
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
                animate={{
                    rotateY: mousePos.x * 15,
                    rotateX: -mousePos.y * 15,
                    scale: hovered ? 1.05 : 1,
                }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                }}
            >
                {/* Card border glow */}
                <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))',
                        opacity: hovered ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                    }}
                />

                {/* WebGL Canvas */}
                <Canvas
                    dpr={[1, 2]}
                    camera={{ position: [0, 0, 2.5], fov: 50 }}
                    style={{
                        borderRadius: '0.75rem',
                    }}
                >
                    <ShaderPlane hovered={hovered} />
                </Canvas>

                {/* Overlay reflection effect */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-xl"
                    style={{
                        background: `radial-gradient(
              circle at ${50 + mousePos.x * 100}% ${50 + mousePos.y * 100}%, 
              rgba(255, 255, 255, 0.15) 0%, 
              transparent 50%
            )`,
                        opacity: hovered ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                    }}
                />
            </motion.div>
        </motion.div>
    )
}
