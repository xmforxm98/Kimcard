import { useRef, useState, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { TextureLoader } from 'three'

const cardBgUrl = '/bg2.png'
const cardCharUrl = '/zus.png'
const cardFrameUrl = '/frame2.png'

// Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export type ElectricSize = 'xs' | 's' | 'm' | 'l' | 'xl';

const electricSizeMap = {
    xs: { range: 0.04, falloff: 50.0, intensity: 1.0, pDensity: 0.22, pSize: 0.8, pIntensity: 150.0, eGlow: 0.6 },
    s: { range: 0.08, falloff: 35.0, intensity: 1.2, pDensity: 0.18, pSize: 1.0, pIntensity: 300.0, eGlow: 1.5 },
    m: { range: 0.15, falloff: 22.0, intensity: 1.5, pDensity: 0.12, pSize: 1.4, pIntensity: 600.0, eGlow: 2.8 },
    l: { range: 0.25, falloff: 14.0, intensity: 1.8, pDensity: 0.08, pSize: 2.0, pIntensity: 1200.0, eGlow: 5.0 },
    xl: { range: 0.45, falloff: 9.0, intensity: 2.2, pDensity: 0.03, pSize: 3.0, pIntensity: 3000.0, eGlow: 10.0 },
};

// Fragment Shader - ULTRA RARE Electric Effect (Layered with Top Frame)
const fragmentShader = `
  uniform sampler2D uBackground;
  uniform sampler2D uCharacter;
  uniform sampler2D uFrame;
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uMouse;
  uniform float uElectricRange;
  uniform float uGlowFalloff;
  uniform float uElectricIntensity;
  uniform float uParticleDensity;
  uniform float uParticleSize;
  uniform float uParticleIntensity;
  uniform float uFrameScale;
  uniform float uCharScale;
  uniform vec2 uCharOffset;
  uniform float uFrameBehind;
  uniform float uShowFrame;
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

  // 10-Octave FBM to match the provided ElectricBorder.tsx
  // Lacunarity: 1.6, Gain: 0.7
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 10; i++) {
      v += a * snoise(p);
      p = p * 1.6 + shift;
      a *= 0.7;
    }
    return v;
  }

  float sdRoundedRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  // Multi-octave Sharp Noise for Razor-thin Filaments
  float filamentNoise(vec2 p, float t) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 5; i++) {
      float n = snoise(p + vec2(t * 0.5, -t * 2.0));
      v += a * pow(1.0 - abs(n), 12.0); 
      p = p * 2.1 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float time = uTime * mix(1.2, 4.0, uHover); 
    float hover = uHover;
    vec2 mouse = uMouse * hover;
    
    // Standard SheenCard coordinates
    vec2 p = (vUv - 0.5) * 1.25; 
    
    // 1. Precise Card SDF (The boundary for background and electricity)
    float sdf = sdRoundedRect(p * 2.15, vec2(1.0), 0.12);
    float cardMask = smoothstep(0.015, -0.015, sdf);
    
    // 2. High-Fidelity crackling (10 Octaves from ElectricBorder reference)
    float f1 = filamentNoise(p * 3.5, time * 1.5);
    float f2 = filamentNoise(p * 7.5, -time * 2.5);
    
    // Electricity flows exactly on the card boundary (sdf)
    float borderTube = exp(-abs(sdf) * 150.0); 
    float filaments = (f1 * 1.6 + f2 * 1.0) * borderTube;
    
    float jitter = step(0.1, fract(sin(time * 60.0) * 43758.5453));
    float electricity = filaments * jitter * mix(0.5, 3.0, hover);
    
    // Divine Palette (White to Gold Gradient)
    vec3 holyWhite = vec3(1.0, 1.0, 0.98); 
    vec3 goldBase = vec3(1.0, 0.85, 0.3); 
    vec3 goldAura = vec3(1.0, 0.7, 0.1);
    
    // Layered Glow system follows the card edge
    float core = smoothstep(0.008, 0.0, abs(sdf) - electricity * 0.012);
    float glow = exp(-abs(sdf) * 80.0) * electricity * 3.5;
    float aura = exp(-abs(sdf) * 12.0) * mix(0.15, 1.2, hover);
    
    // Inverse Gradient: Gold Core -> Holy White Glow
    // This reduces the 'too yellow' feel and adds a holy white outer halo
    vec3 energyColor = (goldBase * core * electricity * 8.0) + (holyWhite * glow * 1.5) + (holyWhite * aura * 0.4);
    
    // 4. CANVAS-INSPIRED: Recursive Branching Lightning (Hyper Strike 2.0)
    float strikeTime = uTime * 3.2; 
    float strikeNoise = snoise(vec2(strikeTime * 0.35, 0.0));
    float strikeTrigger = step(0.96, strikeNoise);
    float strikeSeed = floor(strikeTime);
    
    // Strobe effect from reference (simulating variable stroke and hasFired flash)
    float strobe = step(0.35, fract(sin(uTime * 150.0) * 43758.5453));
    
    float boltLayer = 0.0;
    float boltCore = 0.0;
    
    for(int i = 0; i < 3; i++) {
        float fI = float(i);
        float layerSeed = strikeSeed + fI * 21.43;
        float strikeX = (fract(sin(layerSeed) * 789.12) - 0.5) * 1.5;
        
        // Jagged Recursive Path (Simulating the xRange/yRange steps)
        vec2 boltP = p * 1.5;
        float j1 = snoise(boltP * 4.0 + time * 2.0);
        float j2 = snoise(boltP * 12.0 - time * 4.0);
        float jaggedOffset = (j1 * 0.15 + j2 * 0.05);
        
        // Branching (Simulating canSpawn)
        float branch = step(0.7, fract(sin(layerSeed + boltP.y * 10.0))) * j1 * 0.2;
        
        // Bolt shape: Very thin core + wider glow
        float distToBolt = abs(p.x - strikeX - jaggedOffset - branch);
        boltCore += smoothstep(0.012, 0.0, distToBolt) * (1.0 - fI * 0.2);
        boltLayer += smoothstep(0.05, 0.0, distToBolt) * (0.6 - fI * 0.1);
    }
    
    // Final Lightning: White center, Golden edge
    vec3 strikeLayer = (holyWhite * boltCore + goldBase * boltLayer) * strikeTrigger * strobe * 8.0;
    
    // Canvas Flash (fillRect logic)
    float strikeFlash = strikeTrigger * strobe * 0.4;
    float strikeGlow = strikeTrigger * strobe * exp(-abs(p.x - 0.0) * 1.5) * 0.2;
    
    // 5. CLEAN: Divine Holy Radiance (God Rays)
    float angle = atan(p.y - uCharOffset.y, p.x - uCharOffset.x);
    float rays = sin(angle * 8.0 + time * 0.3) * 0.5 + 0.5;
    rays *= sin(angle * 16.0 - time * 0.1) * 0.5 + 0.5;
    float dist = length(p - uCharOffset);
    float radiance = pow(max(0.0, 1.0 - dist * 0.7), 4.0) * rays * hover;
    vec3 holyLayer = mix(goldBase, holyWhite, 0.8) * radiance * 1.5;
    
    // 6. Texture Sampling
    vec4 bgCol = texture2D(uBackground, vUv + mouse * 0.01);
    float flicker = 1.0 + strikeFlash + (jitter * 0.05); 
    bgCol.rgb = mix(bgCol.rgb, holyWhite, strikeFlash * 0.3); 
    bgCol.rgb *= mix(0.95, 0.6, hover) * flicker; 
    
    vec2 charUv = (vUv - 0.5) / uCharScale + 0.5 + uCharOffset + mouse * -0.06;
    vec4 charCol = texture2D(uCharacter, charUv);
    
    vec2 frameUv = (vUv - 0.5) / uFrameScale + 0.5;
    vec4 frameCol = texture2D(uFrame, frameUv);
    frameCol *= step(0.0, frameUv.x) * step(frameUv.x, 1.0) * step(0.0, frameUv.y) * step(frameUv.y, 1.0);
    
    // 7. Final Compositing
    // Base: Background
    vec3 composite = bgCol.rgb * cardMask;
    
    // Ambient Radiance (God Rays)
    composite += holyLayer * cardMask;
    
    // Frame (Behind Character Option)
    vec3 finalFrame = (frameCol.rgb * (1.0 + glow * 0.5 + strikeFlash)) + mix(goldBase, holyWhite, 0.6) * frameCol.a * (glow + aura) * 0.5;
    if (uShowFrame > 0.5 && uFrameBehind > 0.5) {
        composite = mix(composite, finalFrame, frameCol.a * cardMask);
    }
    
    // Character (Holy Rim Lighting responds to Lightning)
    float rim = pow(1.0 - charCol.a, 4.0) * (glow * 1.2 + aura * 0.5 + strikeFlash * 3.5) * 0.7;
    // Character gets 'over-exposed' during the strike for realism
    vec3 strikeTint = mix(vec3(1.0), holyWhite, 0.8) * strikeFlash * 0.5;
    vec3 finalChar = (charCol.rgb * (1.0 + strikeFlash * 0.6) + strikeTint) + mix(goldBase, holyWhite, 0.5) * rim;
    composite = mix(composite, finalChar, charCol.a);
    
    // --- TOP LAYER (FRONT) ---
    // The Lightning Strikes and Border Energy are now drawn OVER the character
    composite += energyColor * 0.9 * cardMask;
    composite += strikeLayer * cardMask;
    
    // Massive flash bloom that covers the whole front
    composite += holyWhite * (strikeGlow + strikeFlash * 0.3) * cardMask;
    
    // Frame (Front of Character Option)
    if (uShowFrame > 0.5 && uFrameBehind < 0.5) {
        composite = mix(composite, finalFrame, frameCol.a * cardMask);
    }
    
    float glowAlpha = clamp(aura + glow + strikeTrigger + radiance + strikeFlash, 0.0, 1.0);
    float frameAlpha = (uShowFrame > 0.5) ? frameCol.a : 0.0;
    float finalAlpha = max(cardMask, max(charCol.a, max(frameAlpha, glowAlpha)));
    
    gl_FragColor = vec4(composite, finalAlpha);
  }
`

function ShaderPlane({
    hovered,
    mousePos,
    electricSize = 'm',
    frameScale = 1.0,
    charScale = 1.0,
    charOffset = { x: 0, y: 0 },
    showFrame = true,
    frameLayering = 'front',
}: {
    hovered: boolean
    mousePos: { x: number, y: number }
    electricSize?: ElectricSize
    frameScale?: number
    charScale?: number
    charOffset?: { x: number, y: number }
    showFrame?: boolean
    frameLayering?: 'front' | 'back'
}) {
    const materialRef = useRef<THREE.ShaderMaterial>(null)
    const background = useLoader(TextureLoader, cardBgUrl)
    const character = useLoader(TextureLoader, cardCharUrl)
    const frame = useLoader(TextureLoader, cardFrameUrl)

    const params = electricSizeMap[electricSize];

    const uniforms = useMemo(() => ({
        uBackground: { value: background },
        uCharacter: { value: character },
        uFrame: { value: frame },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uElectricRange: { value: params.range },
        uGlowFalloff: { value: params.falloff },
        uElectricIntensity: { value: params.intensity },
        uParticleDensity: { value: params.pDensity },
        uParticleSize: { value: params.pSize },
        uParticleIntensity: { value: params.pIntensity },
        uFrameGlow: { value: params.eGlow },
        uFrameScale: { value: frameScale },
        uCharScale: { value: charScale },
        uCharOffset: { value: new THREE.Vector2(charOffset.x, charOffset.y) },
        uShowFrame: { value: showFrame ? 1.0 : 0.0 },
        uFrameBehind: { value: frameLayering === 'back' ? 1.0 : 0.0 },
    }), [background, character, frame, params, frameScale, charScale, charOffset, showFrame, frameLayering])

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

interface ElectricCardProps {
    electricSize?: ElectricSize;
    frameScale?: number;
    charScale?: number;
    charOffset?: { x: number, y: number };
    showFrame?: boolean;
    frameLayering?: 'front' | 'back';
}

export default function ElectricCard({
    electricSize = 'm',
    frameScale = 1.0,
    charScale = 1.0,
    charOffset = { x: 0, y: 0 },
    showFrame = true,
    frameLayering = 'front'
}: ElectricCardProps) {
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
                            <ShaderPlane
                                hovered={hovered}
                                mousePos={mousePos}
                                electricSize={electricSize}
                                frameScale={frameScale}
                                charScale={charScale}
                                charOffset={charOffset}
                                showFrame={showFrame}
                                frameLayering={frameLayering}
                            />
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
