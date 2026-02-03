import { useRef, useState, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { TextureLoader } from 'three'

const cardBgUrl = '/tarot-card-bg.png'
const cardCharUrl = '/demon-taro-card.png'
const cardFrameUrl = '/frame.png'

// Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export type FireSize = 'xs' | 's' | 'm' | 'l' | 'xl';

const fireSizeMap = {
    xs: { range: 0.04, falloff: 50.0, intensity: 0.8, pDensity: 0.18, pSize: 1.0, pIntensity: 100.0, fGlow: 0.5 },
    s: { range: 0.08, falloff: 35.0, intensity: 1.0, pDensity: 0.14, pSize: 1.3, pIntensity: 250.0, fGlow: 1.2 },
    m: { range: 0.15, falloff: 22.0, intensity: 1.2, pDensity: 0.10, pSize: 1.8, pIntensity: 500.0, fGlow: 2.2 },
    l: { range: 0.25, falloff: 14.0, intensity: 1.5, pDensity: 0.06, pSize: 2.5, pIntensity: 1000.0, fGlow: 4.5 },
    xl: { range: 0.45, falloff: 9.0, intensity: 1.8, pDensity: 0.02, pSize: 3.8, pIntensity: 2500.0, fGlow: 8.0 },
};

// Fragment Shader - ULTRA RARE Inferno Effect (Layered with Top Frame)
const fragmentShader = `
  uniform sampler2D uBackground;
  uniform sampler2D uCharacter;
  uniform sampler2D uFrame;
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uMouse;
  uniform float uFireRange;
  uniform float uGlowFalloff;
  uniform float uFireIntensity;
  uniform float uParticleDensity;
  uniform float uParticleSize;
  uniform float uParticleIntensity;
  uniform float uFrameGlow;
  varying vec2 vUv;
  
  float snoise(vec2 v) {
    vec4 C = vec4(0.211324865, 0.366025403, -0.577350269, 0.024390243);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    vec3 p = mod(vec3(i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ), 289.0);
    p = mod(((p*34.0)+1.0)*p, 289.0);
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.792842914 - 0.85373472 * ( a0*a0 + h*h );
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * snoise(p);
      p = p * 2.1;
      a *= 0.5;
    }
    return v;
  }

  float sdRoundedRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    float time = uTime * 1.5;
    float hover = uHover;
    vec2 mouse = uMouse * hover;
    
    vec2 p = (vUv - 0.5) * 1.25; 
    vec2 cardUv = p + 0.5;
    
    // Noise for all effects
    float noise = fbm(cardUv * 3.0 + vec2(0.0, -time * 0.4));
    
    // 1. Layer: Background (Parallax + Heat Distortion)
    vec2 bgParallax = mouse * 0.02;
    float bgDistortAmt = fbm(cardUv * 4.0 + vec2(0.0, -time * 0.8)) * 0.03 * hover;
    vec2 bgUv = cardUv + bgParallax + bgDistortAmt;
    float bgInBounds = step(0.0, bgUv.x) * step(bgUv.x, 1.0) * step(0.0, bgUv.y) * step(bgUv.y, 1.0);
    vec4 bgCol = texture2D(uBackground, bgUv) * bgInBounds;
    bgCol.rgb *= 0.6 + 0.4 * (1.0 - hover);
    
    // 2. Card SDF (Core Boundary)
    float sdf = sdRoundedRect(p * 2.15, vec2(1.0), 0.12); 
    float cardMask = smoothstep(0.02, -0.02, sdf);
    
    // 3. Layer: Character (Out-of-Frame + Subtle Border Fire)
    vec2 charParallax = mouse * -0.08;
    vec2 charUv = cardUv + charParallax;
    float charInBounds = step(0.0, charUv.x) * step(charUv.x, 1.0) * step(0.0, charUv.y) * step(charUv.y, 1.0);
    vec4 charCol = texture2D(uCharacter, charUv) * charInBounds;
    
    // Shadow for depth
    vec2 shadowUv = charUv + vec2(0.02, 0.02);
    float shadowInBounds = step(0.0, shadowUv.x) * step(shadowUv.x, 1.0) * step(0.0, shadowUv.y) * step(shadowUv.y, 1.0);
    float shadowStr = texture2D(uCharacter, shadowUv).a * shadowInBounds;
    bgCol.rgb = mix(bgCol.rgb, bgCol.rgb * 0.1, shadowStr * charCol.a * 0.75 * hover);
    
    // 4. Flame Logic (Main Border)
    float fireNoise = fbm(p * 2.8 + vec2(0.0, -time * 1.5));
    float fireIntensity = smoothstep(uFireRange, -uFireRange * 0.7, abs(sdf) - fireNoise * 0.18 * (0.5 + hover));
    
    vec3 firePink = vec3(1.0, 0.0, 0.4);
    vec3 fireRed = vec3(1.0, 0.2, 0.1);
    vec3 fireGold = vec3(1.0, 0.95, 0.3);
    vec3 fireColor = mix(mix(fireRed, firePink, 0.5 + 0.5 * sin(time * 3.0 + p.x * 12.0)), fireGold, fireIntensity);
    
    // 5. SUBTLE Character Border Fire (As requested)
    float edgeMask = smoothstep(0.1, 0.5, charCol.a) * (1.0 - smoothstep(0.5, 0.9, charCol.a));
    float edgeNoise = fbm(charUv * 12.0 + vec2(0.0, -time * 1.5));
    vec3 edgeFire = fireColor * edgeNoise * edgeMask * 0.35 * hover; 
    charCol.rgb += edgeFire;
    
    // Rim Lighting
    float rim = pow(1.0 - charCol.a, 3.5) * fireIntensity * hover;
    charCol.rgb += fireColor * rim * 0.5;
    
    // 6. Layer: Frame (High-Intensity Border Glow)
    vec4 frameCol = texture2D(uFrame, cardUv);
    
    // Multi-tap Bloom for intense line glow
    float frameAlphaGlow = (
      texture2D(uFrame, cardUv + vec2(0.006, 0.0)).a +
      texture2D(uFrame, cardUv - vec2(0.006, 0.0)).a +
      texture2D(uFrame, cardUv + vec2(0.0, 0.006)).a +
      texture2D(uFrame, cardUv - vec2(0.0, 0.006)).a +
      texture2D(uFrame, cardUv + vec2(0.004, 0.004)).a +
      texture2D(uFrame, cardUv - vec2(0.004, 0.004)).a
    ) * 0.166;
    
    // Radial Gradient Frame Glow (Spreading from center)
    float centerDist = length(p * vec2(1.0, 0.8)); // Adjusted for card aspect ratio
    vec3 innerGlow = fireGold;
    vec3 outerGlowColor = mix(fireRed, firePink, 0.4 + 0.3 * sin(time * 2.0));
    vec3 gradColor = mix(innerGlow, outerGlowColor, smoothstep(0.1, 0.6, centerDist));
    
    // Fiery pulse effect for the frame
    float framePulse = 0.85 + 0.15 * sin(time * 5.0);
    vec3 fieryGlow = gradColor * frameAlphaGlow * uFrameGlow * framePulse * hover;
    
    // Combine frame texture with intense line glow
    vec3 frameFinal = frameCol.rgb + fieryGlow;
    
    // Glow
    float outerGlow = exp(-max(sdf, 0.0) * uGlowFalloff) * fireIntensity * (1.5 + hover * 2.0);
    
    // 7. Layer: Ember Particles (Categorized XS to XL)
    // Wind-blown turbulence from Bottom-Left to Top-Right
    vec2 baseDir = vec2(-1.0, -1.0);
    float turbulence = snoise(cardUv * 0.5 + time * 0.2);
    vec2 windOffset = baseDir + vec2(sin(time + turbulence), cos(time * 0.8)) * 0.2;
    
    // Use uParticleSize for larger/smaller particles
    vec2 partUv1 = cardUv * (1.2 / uParticleSize) + (time * 0.4 * windOffset);
    vec2 partUv2 = cardUv * (2.5 / uParticleSize) + (time * 0.6 * windOffset);
    
    float n1 = fbm(partUv1 * 5.0);
    float n2 = fbm(partUv2 * 10.0);
    
    // Combinatory noise for high-entropy sparks
    float sparkNoise = pow(n1, 2.0) * n2;
    float sparks = pow(max(0.0, sparkNoise - uParticleDensity), 3.0) * uParticleIntensity;
    
    // Organic flickering and color jitter
    float jitter = snoise(vec2(time * 15.0, cardUv.y * 100.0));
    float flash = smoothstep(0.4, 0.9, snoise(partUv1 * 3.0 + time));
    
    vec3 emberColor = mix(fireRed, fireGold, flash);
    
    // Vertical Fade: Particles burn out as they go up
    float verticalFade = smoothstep(0.9, 0.1, cardUv.y);
    vec3 emberLayer = emberColor * sparks * (0.5 + 0.5 * jitter) * hover * verticalFade;
    
    // Composite
    vec3 bgAndFire = bgCol.rgb * cardMask + (fireColor * fireIntensity * uFireIntensity + fireColor * outerGlow * 0.7);
    
    // Blend: BG/Fire -> Character -> Frame -> Embers (Additive Bloom)
    vec3 composite = mix(bgAndFire, charCol.rgb, charCol.a);
    composite = mix(composite, frameFinal, frameCol.a * cardMask);
    
    // Final high-intensity embers
    composite += emberLayer;
    
    float finalAlpha = max(cardMask, max(charCol.a, clamp(fireIntensity + outerGlow, 0.0, 1.0)));
    
    gl_FragColor = vec4(composite, finalAlpha);
  }
`

function ShaderPlane({
    hovered,
    mousePos,
    fireSize = 'm',
}: {
    hovered: boolean
    mousePos: { x: number, y: number }
    fireSize?: FireSize
}) {
    const materialRef = useRef<THREE.ShaderMaterial>(null)
    const background = useLoader(TextureLoader, cardBgUrl)
    const character = useLoader(TextureLoader, cardCharUrl)
    const frame = useLoader(TextureLoader, cardFrameUrl)

    const params = fireSizeMap[fireSize];

    const uniforms = useMemo(() => ({
        uBackground: { value: background },
        uCharacter: { value: character },
        uFrame: { value: frame },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uFireRange: { value: params.range },
        uGlowFalloff: { value: params.falloff },
        uFireIntensity: { value: params.intensity },
        uParticleDensity: { value: params.pDensity },
        uParticleSize: { value: params.pSize },
        uParticleIntensity: { value: params.pIntensity },
        uFrameGlow: { value: params.fGlow },
    }), [background, character, frame, params])

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
            const targetHover = hovered ? 1 : 0
            materialRef.current.uniforms.uHover.value += (targetHover - materialRef.current.uniforms.uHover.value) * 0.1

            // Interpolate mouse position for smoothness
            materialRef.current.uniforms.uMouse.value.x += (mousePos.x - materialRef.current.uniforms.uMouse.value.x) * 0.1
            materialRef.current.uniforms.uMouse.value.y += (mousePos.y - materialRef.current.uniforms.uMouse.value.y) * 0.1
        }
    })

    return (
        <mesh>
            <planeGeometry args={[2.5, 3.75]} />
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

interface SheenCardProps {
    fireSize?: FireSize;
}

export default function SheenCard({ fireSize = 'm' }: SheenCardProps) {
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
            className="relative cursor-pointer group"
            style={{ width: 320, height: 480, perspective: perspectiveValue }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setMousePos({ x: 0, y: 0 }) }}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="w-full h-full rounded-2xl relative z-10"
                style={{
                    background: 'transparent',
                }}
                animate={{ rotateY: mousePos.x * 20, rotateX: -mousePos.y * 20, scale: hovered ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
                <div className="absolute inset-[-100px] z-0 pointer-events-none">
                    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.8], fov: 50 }}>
                        <Suspense fallback={null}>
                            <ShaderPlane hovered={hovered} mousePos={mousePos} fireSize={fireSize} />
                        </Suspense>
                    </Canvas>
                </div>

                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-10">
                    <div
                        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
                        style={{
                            opacity: hovered ? 0.35 : 0.1,
                            background: `linear-gradient(${135 + mousePos.x * 20}deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(255,100,200,0.1) 100%)`
                        }}
                    />
                </div>
            </motion.div>
        </motion.div>
    )
}

const perspectiveValue = 1000;
